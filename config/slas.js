const ENV = typeof __ENV !== "undefined" ? __ENV : {};

function numberFromEnv(name, fallback) {
  const value = Number(ENV[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const sla = {
  httpReqDurationP95Ms: numberFromEnv("SLA_HTTP_REQ_DURATION_P95_MS", 2000),
  httpReqDurationP99Ms: numberFromEnv("SLA_HTTP_REQ_DURATION_P99_MS", 5000),
  workflowDurationP95Ms: numberFromEnv("SLA_WORKFLOW_DURATION_P95_MS", 10000),
  searchDurationP95Ms: numberFromEnv("SLA_SEARCH_DURATION_P95_MS", 2500),
  bulkDurationP95Ms: numberFromEnv("SLA_BULK_DURATION_P95_MS", 15000),
  errorRate: numberFromEnv("SLA_ERROR_RATE", 0.01),
  businessFailureRate: numberFromEnv("SLA_BUSINESS_FAILURE_RATE", 0.02),
  serverErrorRate: numberFromEnv("SLA_SERVER_ERROR_RATE", 0.001),
};

export function thresholdsFor(testType) {
  const common = {
    http_req_failed: [`rate<${sla.errorRate}`],
    http_req_duration: [
      `p(95)<${sla.httpReqDurationP95Ms}`,
      `p(99)<${sla.httpReqDurationP99Ms}`,
    ],
    business_failure_rate: [`rate<${sla.businessFailureRate}`],
    server_error_rate: [`rate<${sla.serverErrorRate}`],
    workflow_duration: [`p(95)<${sla.workflowDurationP95Ms}`],
    user_journey_duration: [`p(95)<${sla.workflowDurationP95Ms}`],
    search_duration: [`p(95)<${sla.searchDurationP95Ms}`],
    bulk_processing_duration: [`p(95)<${sla.bulkDurationP95Ms}`],
  };

  if (testType === "smoke") {
    return {
      ...common,
      checks: ["rate>0.99"],
    };
  }

  if (testType === "stress" || testType === "spike") {
    return {
      ...common,
      checks: ["rate>0.95"],
    };
  }

  return {
    ...common,
    checks: ["rate>0.98"],
  };
}
