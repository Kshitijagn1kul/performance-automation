import config from "../../config/environments.js";
import { selectedTestType } from "../../config/scenarios.js";

function metricValue(metrics, name, stat) {
  return metrics[name] && metrics[name].values ? metrics[name].values[stat] : undefined;
}

export function buildSummary(data) {
  const metrics = data.metrics || {};

  return {
    framework: "Agnikul ERPNext/Frappe API Performance Framework",
    environment: {
      key: config.key,
      name: config.name,
      baseUrl: config.baseUrl,
    },
    testType: selectedTestType,
    result: {
      httpReqDurationP95Ms: metricValue(metrics, "http_req_duration", "p(95)"),
      httpReqDurationP99Ms: metricValue(metrics, "http_req_duration", "p(99)"),
      httpReqFailedRate: metricValue(metrics, "http_req_failed", "rate"),
      checksRate: metricValue(metrics, "checks", "rate"),
      businessFailureRate: metricValue(metrics, "business_failure_rate", "rate"),
      serverErrorRate: metricValue(metrics, "server_error_rate", "rate"),
      slaBreachCount: metricValue(metrics, "sla_breach_count", "count"),
      validationErrorCount: metricValue(metrics, "validation_error_count", "count"),
      serverErrorCount: metricValue(metrics, "server_error_count", "count"),
      workflowDurationP95Ms: metricValue(metrics, "workflow_duration", "p(95)"),
      userJourneyDurationP95Ms: metricValue(metrics, "user_journey_duration", "p(95)"),
      searchDurationP95Ms: metricValue(metrics, "search_duration", "p(95)"),
      bulkProcessingDurationP95Ms: metricValue(metrics, "bulk_processing_duration", "p(95)"),
    },
    thresholds: data.root_group ? data.root_group.checks : {},
  };
}
