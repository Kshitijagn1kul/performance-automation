import { Counter, Rate, Trend } from "k6/metrics";
import { sla } from "../../config/slas.js";

export const responseDuration = new Trend("response_duration", true);
export const workflowDuration = new Trend("workflow_duration", true);
export const userJourneyDuration = new Trend("user_journey_duration", true);
export const searchDuration = new Trend("search_duration", true);
export const bulkProcessingDuration = new Trend("bulk_processing_duration", true);

export const businessSuccessRate = new Rate("business_success_rate");
export const businessFailureRate = new Rate("business_failure_rate");
export const serverErrorRate = new Rate("server_error_rate");

export const responseStatusCodeDistribution = new Counter("response_status_code_distribution");
export const slaBreachCount = new Counter("sla_breach_count");
export const validationErrorCount = new Counter("validation_error_count");
export const serverErrorCount = new Counter("server_error_count");

export function recordHttpMetrics(endpoint, response, validation) {
  const tags = {
    endpoint: endpoint.id,
    method: endpoint.method,
    module: endpoint.module,
    category: endpoint.category,
    status: String(response.status),
    status_class: `${Math.floor(response.status / 100)}xx`,
  };

  responseDuration.add(response.timings.duration, tags);
  responseStatusCodeDistribution.add(1, tags);

  const serverError = response.status >= 500;
  const validationError = response.status === 400 || response.status === 401 || response.status === 403 || response.status === 422;
  const businessSuccess = validation.ok && !serverError && !validationError;

  businessSuccessRate.add(businessSuccess, tags);
  businessFailureRate.add(!businessSuccess, tags);
  serverErrorRate.add(serverError, tags);

  if (response.timings.duration > sla.httpReqDurationP95Ms) {
    slaBreachCount.add(1, { ...tags, sla: "http_req_duration_p95" });
  }

  if (validationError) {
    validationErrorCount.add(1, tags);
  }

  if (serverError) {
    serverErrorCount.add(1, tags);
  }

  if (endpoint.category === "search") {
    searchDuration.add(response.timings.duration, tags);
  }

  if (endpoint.category === "bulk") {
    bulkProcessingDuration.add(response.timings.duration, tags);
  }
}
