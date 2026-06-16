function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildJUnitReport(data, summary) {
  const checks = data.metrics?.checks?.values || {};
  const failures = Number(checks.fails || 0);
  const failedRate = summary.result.httpReqFailedRate || 0;
  const serverErrorRate = summary.result.serverErrorRate || 0;

  const failureReasons = [];
  if (failures > 0) failureReasons.push(`checks failed=${failures}`);
  if (failedRate > 0.01)
    failureReasons.push(`http_req_failed rate=${failedRate}`);
  if (serverErrorRate > 0.001)
    failureReasons.push(`server_error_rate=${serverErrorRate}`);

  const result = failureReasons.length > 0 ? "failure" : "passed";
  const failureXml = failureReasons.length
    ? `<failure message=\"k6 validation failure\">${escapeXml(failureReasons.join("; "))}</failure>`
    : "";

  const suiteName = "k6 performance checks";
  const testName = `${summary.testType || "performance"} threshold evaluation`;
  const timestamp = new Date().toISOString();

  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<testsuites>
  <testsuite name=\"${escapeXml(suiteName)}\" tests=\"1\" failures=\"${failureReasons.length > 0 ? 1 : 0}\" timestamp=\"${timestamp}\">
    <testcase classname=\"k6\" name=\"${escapeXml(testName)}\">
      ${failureXml}
    </testcase>
  </testsuite>
</testsuites>`;
}
