import { thresholdsFor } from "./slas.js";

const ENV = typeof __ENV !== "undefined" ? __ENV : {};

const testType = (ENV.TEST_TYPE || "smoke").toLowerCase();

const scenarioCatalog = {
  smoke: {
    executor: "constant-vus",
    vus: Number(ENV.VUS || 1),
    duration: ENV.DURATION || "2m",
  },
  baseline: {
    executor: "constant-vus",
    vus: Number(ENV.VUS || 10),
    duration: ENV.DURATION || "10m",
  },
  load: {
    executor: "ramping-vus",
    stages: [
      { duration: ENV.RAMP_UP || "10m", target: Number(ENV.TARGET_VUS || 300) },
      { duration: ENV.STEADY_STATE || "30m", target: Number(ENV.TARGET_VUS || 300) },
      { duration: ENV.RAMP_DOWN || "5m", target: 0 },
    ],
  },
  stress: {
    executor: "ramping-vus",
    stages: [
      { duration: "10m", target: 300 },
      { duration: "15m", target: 600 },
      { duration: "15m", target: Number(ENV.TARGET_VUS || 750) },
      { duration: "10m", target: 0 },
    ],
  },
  spike: {
    executor: "ramping-vus",
    stages: [
      { duration: "2m", target: 50 },
      { duration: "1m", target: Number(ENV.TARGET_VUS || 600) },
      { duration: "5m", target: Number(ENV.TARGET_VUS || 600) },
      { duration: "2m", target: 50 },
      { duration: "2m", target: 0 },
    ],
  },
  endurance: {
    executor: "constant-vus",
    vus: Number(ENV.VUS || 300),
    duration: ENV.DURATION || "4h",
  },
  sla: {
    executor: "constant-vus",
    vus: Number(ENV.VUS || 300),
    duration: ENV.DURATION || "30m",
  },
  capacity: {
    executor: "ramping-vus",
    stages: [
      { duration: "10m", target: 100 },
      { duration: "10m", target: 200 },
      { duration: "10m", target: 300 },
      { duration: "10m", target: 450 },
      { duration: "10m", target: 600 },
      { duration: "10m", target: 0 },
    ],
  },
};

const selectedScenario = scenarioCatalog[testType];

if (!selectedScenario) {
  throw new Error(
    `Invalid TEST_TYPE="${testType}". Must be one of: ${Object.keys(scenarioCatalog).join(", ")}`
  );
}

export const selectedTestType = testType;

export const options = {
  scenarios: {
    recruitment_management: {
      ...selectedScenario,
      gracefulStop: ENV.GRACEFUL_STOP || "30s",
      exec: "recruitmentScenario",
    },
  },
  thresholds: thresholdsFor(testType),
  userAgent: ENV.USER_AGENT || "agnikul-k6-performance-framework/1.0",
  noConnectionReuse: ENV.NO_CONNECTION_REUSE === "true",
  summaryTrendStats: ["min", "avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};
