import config from "../../config/environments.js";
import { selectedTestType } from "../../config/scenarios.js";

function values(metrics, name) {
  return metrics[name] && metrics[name].values ? metrics[name].values : {};
}

function fixed(value, digits = 2, fallback = "n/a") {
  return Number.isFinite(value) ? value.toFixed(digits) : fallback;
}

function percent(value) {
  return `${fixed((value || 0) * 100, 2, "0.00")}%`;
}

function metricRows(metrics) {
  return Object.keys(metrics)
    .sort()
    .map((name) => {
      const metric = metrics[name];
      const vals = metric.values || {};
      return `<tr>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(metric.type || "")}</td>
        <td>${fixed(vals.count, 0)}</td>
        <td>${fixed(vals.avg)}</td>
        <td>${fixed(vals.min)}</td>
        <td>${fixed(vals.med)}</td>
        <td>${fixed(vals.max)}</td>
        <td>${fixed(vals["p(90)"])}</td>
        <td>${fixed(vals["p(95)"])}</td>
        <td>${fixed(vals.rate, 6)}</td>
      </tr>`;
    })
    .join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusClass(failedRate, serverErrorRate) {
  if (serverErrorRate > 0.001 || failedRate > 0.01) return "fail";
  return "pass";
}

export function buildHtmlReport(data, summary) {
  const metrics = data.metrics || {};
  const httpReqDuration = values(metrics, "http_req_duration");
  const httpReqFailed = values(metrics, "http_req_failed");
  const checks = values(metrics, "checks");
  const businessFailureRate = values(metrics, "business_failure_rate");
  const serverErrorRate = values(metrics, "server_error_rate");
  const workflowDuration = values(metrics, "workflow_duration");
  const slaBreachCount = values(metrics, "sla_breach_count");
  const validationErrorCount = values(metrics, "validation_error_count");
  const serverErrorCount = values(metrics, "server_error_count");
  const resultClass = statusClass(httpReqFailed.rate || 0, serverErrorRate.rate || 0);
  const resultLabel = resultClass === "pass" ? "PASSED" : "FAILED";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agnikul k6 Performance Report</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #667085;
      --line: #d9e0ea;
      --blue: #2563eb;
      --green: #16803c;
      --red: #c53030;
      --amber: #b7791f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    header {
      background: #111827;
      color: #fff;
      padding: 28px 36px;
    }
    header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: 0;
    }
    header p {
      margin: 0;
      color: #cbd5e1;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px;
    }
    .status {
      display: inline-block;
      margin-top: 18px;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
    }
    .status.pass { background: #dcfce7; color: var(--green); }
    .status.fail { background: #fee2e2; color: var(--red); }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    }
    .card .label {
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 8px;
    }
    .card .value {
      font-size: 26px;
      font-weight: 700;
    }
    .card .hint {
      color: var(--muted);
      font-size: 12px;
      margin-top: 8px;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin: 18px 0;
      padding: 20px;
    }
    h2 {
      margin: 0 0 16px;
      font-size: 18px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #344054;
      font-weight: 700;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 28px;
      color: #344054;
      font-size: 14px;
    }
    .meta strong { color: var(--text); }
    .warn { color: var(--amber); }
    .bad { color: var(--red); }
    .good { color: var(--green); }
    @media (max-width: 900px) {
      .grid, .meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      header, main { padding: 20px; }
      .grid, .meta { grid-template-columns: 1fr; }
      table { display: block; overflow-x: auto; white-space: nowrap; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Agnikul API Performance Report</h1>
    <p>ERPNext/Frappe k6 performance execution summary</p>
    <span class="status ${resultClass}">${resultLabel}</span>
  </header>
  <main>
    <section>
      <h2>Test Context</h2>
      <div class="meta">
        <div><strong>Environment:</strong> ${escapeHtml(config.name)}</div>
        <div><strong>Base URL:</strong> ${escapeHtml(config.baseUrl)}</div>
        <div><strong>Test Type:</strong> ${escapeHtml(selectedTestType)}</div>
        <div><strong>Generated At:</strong> ${escapeHtml(new Date().toISOString())}</div>
      </div>
    </section>

    <div class="grid">
      <div class="card">
        <div class="label">HTTP p95</div>
        <div class="value">${fixed(httpReqDuration["p(95)"])} ms</div>
        <div class="hint">95th percentile response time</div>
      </div>
      <div class="card">
        <div class="label">HTTP p99</div>
        <div class="value">${fixed(httpReqDuration["p(99)"])} ms</div>
        <div class="hint">99th percentile response time</div>
      </div>
      <div class="card">
        <div class="label">HTTP Failed</div>
        <div class="value ${httpReqFailed.rate > 0.01 ? "bad" : "good"}">${percent(httpReqFailed.rate)}</div>
        <div class="hint">${fixed(httpReqFailed.fails, 0, "0")} failed requests</div>
      </div>
      <div class="card">
        <div class="label">Checks Passed</div>
        <div class="value ${checks.rate < 0.99 ? "bad" : "good"}">${percent(checks.rate)}</div>
        <div class="hint">${fixed(checks.passes, 0, "0")} passed, ${fixed(checks.fails, 0, "0")} failed</div>
      </div>
      <div class="card">
        <div class="label">Business Failure</div>
        <div class="value ${businessFailureRate.rate > 0.02 ? "bad" : "good"}">${percent(businessFailureRate.rate)}</div>
        <div class="hint">Application-level failures</div>
      </div>
      <div class="card">
        <div class="label">Server Error</div>
        <div class="value ${serverErrorRate.rate > 0.001 ? "bad" : "good"}">${percent(serverErrorRate.rate)}</div>
        <div class="hint">${fixed(serverErrorCount.count, 0, "0")} server errors</div>
      </div>
      <div class="card">
        <div class="label">Workflow p95</div>
        <div class="value">${fixed(workflowDuration["p(95)"])} ms</div>
        <div class="hint">End-to-end journey duration</div>
      </div>
      <div class="card">
        <div class="label">SLA Breaches</div>
        <div class="value ${slaBreachCount.count > 0 ? "warn" : "good"}">${fixed(slaBreachCount.count, 0, "0")}</div>
        <div class="hint">${fixed(validationErrorCount.count, 0, "0")} validation errors</div>
      </div>
    </div>

    <section>
      <h2>Executive Summary</h2>
      <p>
        Latency p95 is <strong>${fixed(summary.result.httpReqDurationP95Ms)} ms</strong>,
        HTTP failed rate is <strong>${percent(summary.result.httpReqFailedRate)}</strong>,
        business failure rate is <strong>${percent(summary.result.businessFailureRate)}</strong>,
        and server error rate is <strong>${percent(summary.result.serverErrorRate)}</strong>.
      </p>
    </section>

    <section>
      <h2>All k6 Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Type</th>
            <th>Count</th>
            <th>Avg</th>
            <th>Min</th>
            <th>Median</th>
            <th>Max</th>
            <th>p90</th>
            <th>p95</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          ${metricRows(metrics)}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
`;
}
