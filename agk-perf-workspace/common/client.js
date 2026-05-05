import http from 'k6/http';
import { check } from 'k6';
import { config, requiredConfig } from './config.js';

requiredConfig();

export function authHeaders(extraHeaders = {}) {
  return {
    Authorization: `token ${config.apiKey}:${config.apiSecret}`,
    Accept: 'application/json',
    ...extraHeaders,
  };
}

export function methodUrl(endpoint) {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${config.baseUrl}/api/method/${cleanEndpoint}`;
}

function queryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function request({ name, method = 'GET', endpoint, params = {}, body = null }) {
  const headers = authHeaders(body ? { 'Content-Type': 'application/json' } : {});
  const query = queryString(params);
  const url = `${methodUrl(endpoint)}${query ? `?${query}` : ''}`;
  const payload = body ? JSON.stringify(body) : null;
  const response = http.request(method, url, payload, {
    headers,
    tags: {
      name,
      endpoint,
      method,
    },
  });

  check(response, {
    [`${name}: status is 2xx/3xx`]: (res) => res.status >= 200 && res.status < 400,
    [`${name}: has body`]: (res) => Boolean(res.body),
  });

  return response;
}
