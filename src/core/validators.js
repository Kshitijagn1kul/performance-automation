export function responseJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

export function isSuccess(response) {
  if (!response || response.status === 0 || response.status === undefined) return false;
  return response.status >= 200 && response.status < 300;
}

export function hasException(response) {
  const body = responseJson(response);
  return Boolean(
    body &&
    (body.exc ||
      body.exception ||
      body.exc_type ||
      body._server_messages ||
      (Array.isArray(body._error_message) && body._error_message.length > 0))
  );
}

export function validateBodyKey(response, expectedKey) {
  if (!expectedKey) return true;
  if (response.status === 204) return true;
  const body = responseJson(response);
  return Boolean(body && Object.prototype.hasOwnProperty.call(body, expectedKey));
}

export function classifyError(response) {
  if (!response) {
    return "Connectivity Error";
  }

  // Connectivity/Network/DNS error detection: status 0 or response error property
  if (response.status === 0 || response.status === undefined || response.error) {
    return "Connectivity Error";
  }

  const status = response.status;
  const bodyText = response.body ? String(response.body) : "";

  if (status === 401) {
    return "Authentication Failed";
  }

  if (status === 403) {
    if (
      bodyText.includes("not whitelisted") ||
      bodyText.includes("not_whitelisted") ||
      bodyText.includes("Function is not whitelisted")
    ) {
      return "Function Not Whitelisted";
    }
    return "Role/Permission Error";
  }

  if (status === 404) {
    return "Endpoint Not Found";
  }

  if (status === 429) {
    return "Rate Limit Exceeded";
  }

  if (status >= 500 && status < 600) {
    return "Server Error";
  }

  // If there's an exception (e.g. Frappe exception), classify as Server Error
  if (hasException(response)) {
    return "Server Error";
  }

  if (status >= 400) {
    return `HTTP Error ${status}`;
  }

  // Otherwise, it might be a validation failure (like missing expected body key)
  return "Validation Error";
}

export function validateFrappeResponse(endpoint, response) {
  const expectedStatus = endpoint.expectedStatus || [200];
  const statusOk = expectedStatus.indexOf(response.status) !== -1;
  const bodyOk = validateBodyKey(response, endpoint.expectedBodyKey);
  const hasFrappeEx = hasException(response);

  return {
    ok: Boolean(statusOk && bodyOk && !hasFrappeEx),
    statusOk,
    bodyOk,
    hasFrappeException: hasFrappeEx,
  };
}
