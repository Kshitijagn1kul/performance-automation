import {
  options as scenarioOptions,
  selectedTestType,
} from "../config/scenarios.js";
import config from "../config/environments.js";
import { buildHtmlReport } from "../src/core/htmlReport.js";
import { buildJUnitReport } from "../src/core/junitReport.js";
import { buildSummary } from "../src/core/summary.js";
import { buildTextReport } from "../src/core/textReport.js";
import {
  executeRecruitmentJourney,
  recruitmentEndpointInventory,
} from "../src/workflows/recruitment.js";

const ENV = typeof __ENV !== "undefined" ? __ENV : {};

export const options = scenarioOptions;

export function setup() {
  const inventory = recruitmentEndpointInventory();
  console.log(
    `[SETUP] ${config.name} | ${selectedTestType} | ${inventory.executable}/${inventory.total} executable endpoints | mutations=${inventory.mutationsIncluded}`,
  );
  return {
    environment: config.key,
    testType: selectedTestType,
    inventory,
  };
}

export function recruitmentScenario() {
  executeRecruitmentJourney();
}

export function handleSummary(data) {
  const summary = buildSummary(data);
  const summaryFile =
    ENV.SUMMARY_FILE || `results/${selectedTestType}-summary.json`;
  const htmlReport = buildHtmlReport(data, summary);

  const junitReport = buildJUnitReport(data, summary);

  return {
    stdout: buildTextReport(data),
    [summaryFile]: `${JSON.stringify(summary, null, 2)}\n`,
    [`results/${selectedTestType}-raw-summary.json`]: `${JSON.stringify(data, null, 2)}\n`,
    [`results/${selectedTestType}-report.html`]: htmlReport,
    [`results/${selectedTestType}-junit.xml`]: junitReport,
    "results/html-report.html": htmlReport,
    "testing/html-report.html": htmlReport,
  };
}
