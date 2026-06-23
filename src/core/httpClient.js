import http from "k6/http";
import { check } from "k6";
import config from "../../config/environments.js";
import { recordHttpMetrics } from "./metrics.js";
import { validateFrappeResponse, classifyError } from "./validators.js";

function encodeQuery(query) {
  const parts = [];
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value === undefined || value === null || value === "") return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  return parts.join("&");
}

function parseQueryString(queryString) {
  const query = {};
  if (!queryString) return query;

  queryString.split("&").forEach((part) => {
    if (!part) return;
    const [key, value = ""] = part.split("=");
    if (!key) return;
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  });

  return query;
}

function requestHeaders(extraHeaders = {}) {
  return {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": config.userAgent,
    ...extraHeaders,
  };
}

function queryFor(endpoint, data) {
  const query = parseQueryString(endpoint.defaultQueryString);
  const allowedArgs = [
    ...(endpoint.mandatoryArgs || []),
    ...(endpoint.optionalArgs || []),
  ];

  allowedArgs.forEach((arg) => {
    const key = arg.trim();
    if (!key) return;
    if (data[key] !== undefined && data[key] !== "") {
      query[key] = data[key];
    }
  });

  return query;
}

function payloadFor(endpoint, data) {
  const payload = {};
  (endpoint.mandatoryArgs || []).forEach((arg) => {
    if (data[arg] !== undefined && data[arg] !== "") payload[arg] = data[arg];
  });
  (endpoint.optionalArgs || []).forEach((arg) => {
    if (data[arg] !== undefined && data[arg] !== "") payload[arg] = data[arg];
  });
  return payload;
}

export function callEndpoint(endpoint, data = {}, tags = {}) {
  const query = queryFor(endpoint, data);
  const queryString = encodeQuery(query);
  const url = `${config.baseUrl}${endpoint.path}${queryString ? `?${queryString}` : ""}`;
  const requestParams = {
    headers: requestHeaders(),
    timeout: config.timeout,
    tags: {
      name: endpoint.id,
      endpoint: endpoint.id,
      module: endpoint.module,
      category: endpoint.category,
      ...tags,
    },
  };

  const method = endpoint.method.toUpperCase();
  const response =
    method === "GET"
      ? http.get(url, requestParams)
      : http.request(
          method,
          url,
          JSON.stringify(payloadFor(endpoint, data)),
          requestParams,
        );

  const validation = validateFrappeResponse(endpoint, response);

  if (!validation.ok) {
    const reason = classifyError(response);
    console.error(
      `[FAIL]\n` +
      `Endpoint: ${endpoint.id}\n` +
      `Status: ${response.status !== undefined ? response.status : 0}\n` +
      `Reason: ${reason}`
    );
  }

  recordHttpMetrics(endpoint, response, validation);

  check(
    response,
    {
      [`${endpoint.id} status is expected`]: () => validation.statusOk,
      [`${endpoint.id} body is valid Frappe JSON`]: () => validation.bodyOk,
      [`${endpoint.id} has no Frappe exception`]: () =>
        !validation.hasFrappeException,
    },
    requestParams.tags,
  );

  return { response, validation };
}
