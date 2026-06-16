import { group, sleep } from "k6";
import { SharedArray } from "k6/data";
import { callEndpoint } from "../core/httpClient.js";
import { csvToObjects } from "../core/csv.js";
import { chooseWeighted, randomIntBetween } from "../core/selection.js";
import { userJourneyDuration, workflowDuration } from "../core/metrics.js";

const ENV = typeof __ENV !== "undefined" ? __ENV : {};
const includeMutations = ENV.INCLUDE_MUTATIONS === "true";

const endpointCatalog = new SharedArray("recruitment endpoints", () => {
  const catalog = JSON.parse(open("../../data/generated/recruitment.endpoints.json"));
  return catalog.endpoints;
});

const parameterRows = new SharedArray("recruitment parameter rows", () =>
  csvToObjects(open("../../data/test-data/recruitment.params.csv"))
);

const workflowMix = new SharedArray("recruitment workflow mix", () =>
  csvToObjects(open("../../data/test-data/workflow.mix.csv"))
);

const endpointsById = endpointCatalog.reduce((acc, endpoint) => {
  if (includeMutations || endpoint.method === "GET") {
    acc[endpoint.id] = endpoint;
  }
  return acc;
}, {});

const paramsByEndpoint = parameterRows.reduce((acc, row) => {
  if (!acc[row.endpointId]) acc[row.endpointId] = [];
  acc[row.endpointId].push(row);
  return acc;
}, {});

function endpoint(id) {
  const item = endpointsById[id];
  if (!item) {
    throw new Error(`Endpoint "${id}" is not available. Check generated catalog or INCLUDE_MUTATIONS.`);
  }
  return item;
}

function paramsFor(id) {
  const rows = paramsByEndpoint[id] || [{}];
  return chooseWeighted(rows);
}

function call(id, tags = {}) {
  const item = endpoint(id);
  return callEndpoint(item, paramsFor(id), tags);
}

function think(row) {
  sleep(randomIntBetween(row.thinkTimeMinMs, row.thinkTimeMaxMs) / 1000);
}

function executeWorkflow(name, row, steps) {
  const startedAt = Date.now();
  group(name, () => {
    steps.forEach((step) => {
      step();
      think(row);
    });
  });
  const duration = Date.now() - startedAt;
  workflowDuration.add(duration, { workflow: name });
  userJourneyDuration.add(duration, { workflow: name });
}

function quickAccess(row) {
  executeWorkflow("quick_access", row, [
    () => call("generic_getapi_get_users_role", { workflow: "quick_access" }),
    () => call("quick_access_dashboardapi_get_fu_pending_count", { workflow: "quick_access" }),
    () => call("quick_access_dashboardapi_get_pending_counts", { workflow: "quick_access" }),
  ]);
}

function dashboardReview(row) {
  executeWorkflow("dashboard_review", row, [
    () => call("dashboard_dashboardapi_get_counts", { workflow: "dashboard_review" }),
    () => call("dashboard_dashboardapi_get_joblist", { workflow: "dashboard_review" }),
    () => call("dashboard_dashboardapi_candidate_analytic", { workflow: "dashboard_review" }),
    () => call("dashboard_dashboardapi_application_conv_int", { workflow: "dashboard_review" }),
    () => call("dashboard_dashboardapi_candidate_source_analytics", { workflow: "dashboard_review" }),
  ]);
}

function jobPostSearch(row) {
  executeWorkflow("job_post_search", row, [
    () => call("job_post_getapi_get_jp", { workflow: "job_post_search" }),
    () => call("job_post_getapi_get_jobstatus_counts", { workflow: "job_post_search" }),
    () => call("job_post_getapi_view_details", { workflow: "job_post_search" }),
  ]);
}

function assignmentReview(row) {
  executeWorkflow("assignment_review", row, [
    () => call("assignments_getapi_source_candidate", { workflow: "assignment_review" }),
    () => call("assignments_getapi_candidate_screening", { workflow: "assignment_review" }),
    () => call("assignments_getapi_interview", { workflow: "assignment_review" }),
    () => call("assignments_getapi_hired", { workflow: "assignment_review" }),
    () => call("assignments_getapi_get_candidate_card_counts", { workflow: "assignment_review" }),
  ]);
}

function candidateDeepDive(row) {
  executeWorkflow("candidate_deep_dive", row, [
    () => call("job_post_getapi_get_jp", { workflow: "candidate_deep_dive" }),
    () => call("recruitment_tracker_getapi_get_teams_summary", { workflow: "candidate_deep_dive" }),
    () => call("job_post_getapi_view_details", { workflow: "candidate_deep_dive" }),
  ]);
}

function portalReview(row) {
  executeWorkflow("portal_review", row, [
    () => call("recruitment_log_job_portal_getapi_referral_candidates", { workflow: "portal_review" }),
    () => call("recruitment_log_inbound_getapi_inbound_candidates", { workflow: "portal_review" }),
  ]);
}

const workflowHandlers = {
  quick_access: quickAccess,
  dashboard_review: dashboardReview,
  job_post_search: jobPostSearch,
  assignment_review: assignmentReview,
  candidate_deep_dive: candidateDeepDive,
  portal_review: portalReview,
};

export function executeRecruitmentJourney() {
  const selected = chooseWeighted(workflowMix);
  const handler = workflowHandlers[selected.workflow];

  if (!handler) {
    throw new Error(`Workflow "${selected.workflow}" is not implemented.`);
  }

  handler(selected);
}

export function recruitmentEndpointInventory() {
  return {
    total: endpointCatalog.length,
    executable: Object.keys(endpointsById).length,
    mutationsIncluded: includeMutations,
  };
}
