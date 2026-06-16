export function responseJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

export function validateFrappeResponse(endpoint, response) {
  const expectedStatus = endpoint.expectedStatus || [200];
  const statusOk = expectedStatus.indexOf(response.status) !== -1;
  const body = responseJson(response);

  const hasFrappeException =
    body &&
    (body.exc ||
      body.exception ||
      body.exc_type ||
      body._server_messages ||
      (Array.isArray(body._error_message) && body._error_message.length > 0));

  const bodyOk =
    !endpoint.expectedBodyKey ||
    response.status === 204 ||
    (body && Object.prototype.hasOwnProperty.call(body, endpoint.expectedBodyKey));

  return {
    ok: Boolean(statusOk && bodyOk && !hasFrappeException),
    statusOk,
    bodyOk,
    hasFrappeException: Boolean(hasFrappeException),
  };
}
