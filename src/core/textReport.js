function values(metrics, name) {
  return metrics[name] && metrics[name].values ? metrics[name].values : {};
}

function fixed(value, digits = 2, fallback = "0") {
  return Number.isFinite(value) ? value.toFixed(digits) : fallback;
}

function durationMs(value) {
  return `${fixed(value, 2)}ms`;
}

function ratePercent(value) {
  return `${fixed((value || 0) * 100, 2)}%`;
}

function count(value) {
  return Number.isFinite(value) ? String(value) : "0";
}

function rateTrueCount(value) {
  return Number.isFinite(value && value.passes) ? value.passes : 0;
}

function rateTotal(value) {
  const passes = Number.isFinite(value && value.passes) ? value.passes : 0;
  const fails = Number.isFinite(value && value.fails) ? value.fails : 0;
  return passes + fails;
}

function line(name, value) {
  return `    ${name.padEnd(30, ".")}: ${value}`;
}

export function buildTextReport(data) {
  const metrics = data.metrics || {};
  const httpReqDuration = values(metrics, "http_req_duration");
  const httpReqFailed = values(metrics, "http_req_failed");
  const httpReqs = values(metrics, "http_reqs");
  const iterationDuration = values(metrics, "iteration_duration");
  const iterations = values(metrics, "iterations");
  const dataReceived = values(metrics, "data_received");
  const dataSent = values(metrics, "data_sent");
  const checks = values(metrics, "checks");
  const businessFailureRate = values(metrics, "business_failure_rate");
  const serverErrorRate = values(metrics, "server_error_rate");
  const workflowDuration = values(metrics, "workflow_duration");
  const userJourneyDuration = values(metrics, "user_journey_duration");
  const slaBreachCount = values(metrics, "sla_breach_count");
  const validationErrorCount = values(metrics, "validation_error_count");
  const serverErrorCount = values(metrics, "server_error_count");

  return [
    "",
    "",
    "  █ TOTAL RESULTS ",
    "",
    "    HTTP",
    line(
      "http_req_duration",
      `avg=${durationMs(httpReqDuration.avg)} min=${durationMs(httpReqDuration.min)} med=${durationMs(
        httpReqDuration.med
      )} max=${durationMs(httpReqDuration.max)} p(90)=${durationMs(
        httpReqDuration["p(90)"]
      )} p(95)=${durationMs(httpReqDuration["p(95)"])}`
    ),
    line("http_req_failed", `${ratePercent(httpReqFailed.rate)} ${count(rateTrueCount(httpReqFailed))} out of ${count(rateTotal(httpReqFailed))}`),
    line("http_reqs", `${count(httpReqs.count)} ${fixed(httpReqs.rate, 6)}/s`),
    "",
    "    EXECUTION",
    line(
      "iteration_duration",
      `avg=${durationMs(iterationDuration.avg)} min=${durationMs(iterationDuration.min)} med=${durationMs(
        iterationDuration.med
      )} max=${durationMs(iterationDuration.max)} p(90)=${durationMs(
        iterationDuration["p(90)"]
      )} p(95)=${durationMs(iterationDuration["p(95)"])}`
    ),
    line("iterations", `${count(iterations.count)} ${fixed(iterations.rate, 6)}/s`),
    line("checks", `${ratePercent(checks.rate)} ${count(checks.passes)} passed, ${count(checks.fails)} failed`),
    "",
    "    BUSINESS",
    line("business_failure_rate", ratePercent(businessFailureRate.rate)),
    line("server_error_rate", ratePercent(serverErrorRate.rate)),
    line("workflow_duration", `p(95)=${durationMs(workflowDuration["p(95)"])} avg=${durationMs(workflowDuration.avg)}`),
    line("user_journey_duration", `p(95)=${durationMs(userJourneyDuration["p(95)"])} avg=${durationMs(userJourneyDuration.avg)}`),
    line("sla_breach_count", count(slaBreachCount.count)),
    line("validation_error_count", count(validationErrorCount.count)),
    line("server_error_count", count(serverErrorCount.count)),
    "",
    "    NETWORK",
    line("data_received", `${fixed((dataReceived.count || 0) / 1000, 1)} kB`),
    line("data_sent", `${fixed((dataSent.count || 0) / 1000, 1)} kB`),
    "",
    "",
  ].join("\n");
}
