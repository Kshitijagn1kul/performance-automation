# Framework Review and CI/CD Readiness

Date reviewed: 2026-06-16

Scope reviewed:

- k6 entrypoints: `script.js`, `tests/recruitment.js`
- Configuration: `config/environments.js`, `config/scenarios.js`, `config/slas.js`
- Runtime engine: `src/core/*`
- Recruitment workflow: `src/workflows/recruitment.js`
- Test data: `data/generated/recruitment.endpoints.json`, `data/test-data/*.csv`
- CI workflow: `.github/workflows/k6-performance.yml`
- Latest available smoke result: `results/smoke-summary.json`, `results/smoke-raw-summary.json`

No application code changes are included in this review document.

## Executive Summary

The framework is implemented in the right direction and is suitable as a foundation for ERPNext/Frappe API performance testing.

The good parts:

- Modular k6 structure is in place.
- Environment configuration exists for local, staging, and production.
- Frappe token authentication is centralized.
- Endpoint catalog is generated from the Recruitment API CSV.
- Runtime data and workflow mix are externalized in CSV.
- Smoke, baseline, load, stress, spike, endurance, SLA, and capacity profiles exist.
- Custom metrics exist for business failure, server error, workflow duration, search duration, SLA breach count, and validation errors.
- HTML, JSON, and raw summary outputs are generated.
- GitHub Actions workflow exists as a first CI/CD draft.

Current readiness status:

```text
Framework foundation: Good
Smoke execution readiness: Partially ready
Failure diagnosis readiness: Needs improvement
CI/CD readiness: Not ready yet for full rollout
Large load execution readiness: Not ready on GitHub-hosted runners
```

Before CI/CD rollout, fix the blockers and complete the prerequisites listed below.

## Validation Performed

The following checks were performed locally:

```bash
k6 inspect --env API_KEY=dummy --env API_SECRET=dummy script.js
```

Result:

```text
Passed
```

Endpoint catalog consistency check:

```text
Generated endpoint count: 34
Actual endpoint records: 34
Duplicate endpoint IDs: 0
Runtime parameter rows: 15
Parameter rows without matching endpoint: 0
```

Latest smoke summary reviewed:

```text
HTTP p95: 204.48 ms
HTTP p99: 314.68 ms
HTTP failed rate: 12.50%
Business failure rate: 12.50%
Server error rate: 0.00%
Checks rate: 87.50%
Workflow p95: 9540.35 ms
```

Important note:

The latest pasted execution was manually interrupted using `Ctrl+C`.

```text
test run was aborted because k6 received an interrupt signal
```

That run should not be used as an official smoke result. It is useful for debugging, but not for pass/fail sign-off.

## Severity-Ranked Findings

## Critical Findings

### 1. `.env` exists locally and must never be committed

Evidence:

```text
.env
.env.example
```

Risk:

The local workspace contains a `.env` file. It may contain API credentials. I did not inspect its values, but this file must be treated as sensitive.

Impact:

If `.env` is committed or uploaded, ERPNext/Frappe API credentials can be exposed.

Current protection:

`.gitignore` contains:

```text
.env
```

Recommendation:

- Confirm `.env` is not committed when this folder becomes a Git repository.
- Use GitHub Secrets for CI/CD.
- Rotate any credentials if `.env` was ever shared, committed, or uploaded.

CI/CD prerequisite:

```text
GitHub Secrets must be configured before running CI tests.
```

Required secrets:

```text
STAGING_API_KEY
STAGING_API_SECRET
PROD_API_KEY
PROD_API_SECRET
K6_API_KEY
K6_API_SECRET
```

Prefer environment-specific secrets over generic secrets.

## High Findings

### 2. `.env` loading is inconsistent across modules

Evidence:

`config/environments.js` reads `.env` fallback values.

But these files read only `__ENV`:

```text
config/scenarios.js
config/slas.js
src/workflows/recruitment.js
tests/recruitment.js
```

Impact:

Direct execution can behave differently depending on the command.

Example:

```bash
k6 run script.js
```

This may load credentials from `.env`, but `TEST_TYPE`, `DURATION`, `VUS`, SLA overrides, and `INCLUDE_MUTATIONS` may still use defaults unless passed through `--env` or exported by the shell.

The npm wrapper is safer because `scripts/run-k6.sh` sources `.env` before running k6.

Current safer command:

```bash
npm run smoke
```

Recommendation:

Before CI/CD rollout, standardize environment loading.

Preferred approach:

- Use `--env` in CI.
- Use `npm run smoke/load/...` locally.
- Document that direct `k6 run script.js` requires exported environment variables or `--env` flags.

Future improvement:

Create a shared environment helper so all config modules read values consistently.

### 3. Current smoke failures are caused by API/data validity, not response time

Evidence from latest raw summary:

```text
job_post_search::job_post_getapi_view_details status is expected: 0 passed, 1 failed
candidate_deep_dive::job_post_getapi_view_details status is expected: 0 passed, 1 failed
```

Failed API:

```text
/api/method/recruitment.config.getapi.view_details
```

Static parameter:

```text
job_name=RE-2026-8358
```

Impact:

CI/CD will fail if this static candidate is missing, inactive, inaccessible, or not valid in staging.

Recommendation:

Before CI/CD, replace single static business IDs with a stable data pool or pre-test data setup.

Minimum prerequisite:

Prepare valid staging data for:

```text /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /
   /  \/    \    | |/ /  /   ‾‾\
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/


     execution: local
        script: script.js
 web dashboard: http://127.0.0.1:5665
        output: -

     scenarios: (100.00%) 1 scenario, 1 max VUs, 2m30s max duration (incl. graceful stop):
              * recruitment_management: 1 looping VUs for 2m0s (exec: recruitmentScenario, gracefulStop: 30s)

INFO[0000] [SETUP] Staging (QA Testing) | smoke | 26/34 executable endpoints | mutations=false  source=console
^C

  █ TOTAL RESULTS

    HTTP
    http_req_duration.............: avg=87.97ms min=48.30ms med=64.68ms max=342.24ms p(90)=124.71ms p(95)=204.48ms
    http_req_failed...............: 12.50% 2 out of 16
    http_reqs.....................: 16 0.551274/s

    EXECUTION
    iteration_duration............: avg=5655.31ms min=2894.31ms med=4846.34ms max=10034.26ms p(90)=9047.18ms p(95)=9540.72ms
    iterations....................: 4 0.137818/s
    checks........................: 87.50% 42 passed, 6 failed

    BUSINESS
    business_failure_rate.........: 12.50%
    server_error_rate.............: 0.00%
    workflow_duration.............: p(95)=9540.35ms avg=5654.75ms
    user_journey_duration.........: p(95)=9540.35ms avg=5654.75ms
    sla_breach_count..............: 0
    validation_error_count........: 0
    server_error_count............: 0

    NETWORK
    data_received.................: 23.4 kB
    data_sent.....................: 5.5 kB


running (0m29.0s), 0/1 VUs, 4 complete and 1 interrupted iterations
recruitment_management ✗ [========>-----------------------------] 1 VUs  0m29.0s/2m0s
ERRO[0029] test run was aborted because k6 received a 'interrupt' signal
┌──(shanmugavelm_as@AGKL-LAP-258)-[~/Documents/test]
candidate_name
job_name
team
sub_team
role
date ranges
tabs
requested_by values
```

Best approach:

Use a pre-test data generation step that fetches valid Recruitment records and writes runtime CSV or JSON data before k6 starts.

### 4. GitHub Actions points to `tests/recruitment.js`, while local command uses `script.js`

Evidence:

CI workflow:

```text
.github/workflows/k6-performance.yml
filename: tests/recruitment.js
```

Local usage:

```text
k6 run script.js
npm run smoke
```

Impact:

Both entrypoints currently work, but inconsistent entrypoints create confusion during support and debugging.

Recommendation:

Before CI/CD rollout, choose one official entrypoint.

Recommended:

```text
script.js
```

Reason:

It matches the local command expected by the team and wraps the real test entrypoint cleanly.

### 5. Pull request CI may fail because secrets may not be available

Evidence:

GitHub Actions includes:

```text
pull_request:
  branches:
    - main
```

The job requires API credentials.

Impact:

Pull request workflows may fail if secrets are unavailable, especially for forked PRs or restricted GitHub environments.

Recommendation:

Separate CI into two levels:

```text
PR validation:
  - generate endpoint catalog
  - k6 inspect
  - static data validation
  - no live API calls

Manual/scheduled performance:
  - live staging smoke/load tests
  - requires secrets
```

## Medium Findings

### 6. Workflow duration includes user think time

Evidence:

`src/workflows/recruitment.js` records workflow duration around API calls and sleeps:

```text
executeWorkflow()
step()
think(row)
workflowDuration.add(duration)
```

Impact:

`workflow_duration` and `user_journey_duration` include artificial think time.

This can make thresholds fail even when API response times are healthy.

Example from latest result:

```text
HTTP p95: 204.48 ms
Workflow p95: 9540.35 ms
```

This is not necessarily a server performance issue.

Recommendation:

Define two separate SLA concepts:

```text
API SLA:
  Based on http_req_duration and response_duration

Journey SLA:
  Based on full workflow time including think time
```

For CI/CD smoke tests, API SLA should be the primary gate.

### 7. Last-step think time is included in workflow duration

Evidence:

The workflow loop sleeps after every step, including the final step.

Impact:

Journey duration may be inflated by one extra think-time interval.

Recommendation:

Before using workflow duration as an official SLA gate, decide whether final-step think time should be included.

### 8. Response status code distribution is not visible in summary

Evidence:

`response_status_code_distribution` is implemented as a counter with tags:

```text
status
status_class
endpoint
```

Impact:

k6 summaries do not clearly display tag-level breakdowns in the generated JSON summary. This limits failure diagnosis from the HTML report.

Recommendation:

For CI/CD diagnosis, add one of these:

- Prometheus remote write and Grafana panels by status tag
- Per-status custom counters
- A debug-mode failed-response sample report

### 9. Failed response bodies are not captured

Evidence:

The framework validates Frappe responses, but the final report does not include failed response samples.

Impact:

When an API fails, the report shows which check failed but not the exact Frappe exception body.

Recommendation:

Before CI/CD, create a debug execution mode for failure triage.

Example operating mode:

```text
DEBUG_FAILURES=true
```

It should capture limited failed response details without exposing secrets or large payloads.

### 10. SLA breach counter naming is slightly misleading

Evidence:

`sla_breach_count` increments when an individual request duration exceeds `sla.httpReqDurationP95Ms`.

Impact:

`p95` is an aggregate percentile SLA, not a per-request threshold. The counter is useful, but the tag name `http_req_duration_p95` can be misunderstood.

Recommendation:

Clarify the metric meaning:

```text
Number of requests exceeding configured duration threshold
```

Do not interpret it as the same thing as k6 percentile threshold failure.

### 11. Generated query strings depend heavily on CSV quality

Evidence:

The endpoint generator removes whitespace from endpoint cells and parses query strings directly from the CSV.

Risk example:

The Recruitment Tracker row contains a complex query expression in the CSV:

```text
requested_by=Self tab=request&team=Automation&sub_team=Back+end+developer&role=Associate+C (or) job_name=...
```

After normalization, malformed query parts may remain in `defaultQueryString`.

Impact:

If the CSV has missing `&`, explanatory text, or example alternatives, the generated endpoint catalog can contain imperfect default query strings.

Recommendation:

Before CI/CD:

- Treat the API CSV as a contract.
- Remove explanatory text from endpoint cells.
- Keep example values in test-data CSV, not in the endpoint column.
- Validate generated query strings automatically.

## Low Findings

### 12. Mutation API support exists but is not ready for execution

Current behavior:

```text
mutations=false
26/34 executable endpoints
```

This is good and safe.

Gap:

Mutation APIs need dedicated payload data, cleanup strategy, idempotency rules, and CSRF/session handling if required.

Recommendation:

Keep mutation APIs disabled until the test data lifecycle is designed.

### 13. `results/` files are generated locally

Current behavior:

Result files are created:

```text
results/smoke-summary.json
results/smoke-raw-summary.json
results/smoke-report.html
results/html-report.html
testing/html-report.html
```

Risk:

Generated reports should not be committed.

Current protection:

`.gitignore` excludes `results/*` and keeps only `results/.gitkeep`.

Recommendation:

Keep this behavior.

## CI/CD Prerequisites

Complete these before enabling the GitHub Actions performance workflow.

### Access and Network

- GitHub runner or self-hosted runner must be able to reach staging:

```text
https://qa.example.com
```

- Firewall and IP allowlist rules must permit the runner.
- For load, stress, endurance, and capacity tests, prefer a self-hosted runner inside the company network.
- GitHub-hosted runners should be used only for lightweight smoke or static validation.

### Secrets

Create GitHub Secrets:

```text
STAGING_API_KEY
STAGING_API_SECRET
PROD_API_KEY
PROD_API_SECRET
```

Optional fallback secrets:

```text
K6_API_KEY
K6_API_SECRET
```

Rules:

- Do not commit `.env`.
- Do not print credentials.
- Use GitHub Environments for production approvals.
- Restrict production performance tests to manual approval only.

### Test Data

Prepare stable data for staging:

```text
candidate_name
job_name
team
sub_team
role
requested_by
tab
date ranges
```

Minimum requirement:

The candidate used by `view_details` must exist and be accessible by the API key user.

Recommended:

Use multiple valid rows instead of one static candidate.

Best:

Generate dynamic test data before each CI run.

### SLA Baseline

Before enforcing CI/CD gates, define official SLAs:

```text
Smoke API p95
Smoke error rate
Load API p95
Load API p99
Business failure rate
Server error rate
Workflow duration excluding or including think time
```

Do not use the current workflow duration threshold as a strict business SLA until the think-time decision is finalized.

### Observability

For load and endurance tests, CI/CD must be correlated with infrastructure monitoring:

```text
CPU
Memory
Disk I/O
Network
Database
Redis
Gunicorn workers
RQ workers
Nginx
MariaDB/Postgres query behavior
```

Minimum before load testing:

- Prometheus/Grafana or equivalent monitoring available.
- ERPNext/Frappe error logs accessible.
- Database slow query logs enabled for test windows.

### Workflow Design

Before CI/CD, confirm:

- Workflow mix matches actual Recruitment usage.
- Think times are realistic.
- Read-only smoke test is safe for staging.
- Mutation APIs remain disabled.
- Test data will not pollute production.

## Recommended CI/CD Design

### Pull Request Workflow

Purpose:

Catch framework errors without hitting live ERPNext.

Recommended checks:

```text
node scripts/generate-endpoints.mjs ...
k6 inspect --env API_KEY=dummy --env API_SECRET=dummy script.js
endpoint catalog validation
test-data mapping validation
```

No live API calls.

### Manual Staging Smoke Workflow

Purpose:

Validate credentials, API availability, and safe read workflows.

Recommended:

```text
ENVIRONMENT=staging
TEST_TYPE=smoke
VUS=1
DURATION=2m
```

Artifacts:

```text
results/smoke-summary.json
results/smoke-raw-summary.json
results/smoke-report.html
results/html-report.html
```

### Scheduled Baseline Workflow

Purpose:

Track performance drift over time.

Recommended schedule:

```text
Nightly or after staging deployment
```

Recommended scale:

```text
10 to 25 VUs initially
```

### Load, Stress, Endurance, Capacity

Do not run these on GitHub-hosted runners by default.

Recommended execution:

```text
self-hosted runner
controlled test window
monitoring enabled
stakeholders informed
rollback/support team available
```

## Recommended Action Plan

### Phase 1: Stabilize Smoke Test

1. Validate failing API:

```text
/api/method/recruitment.config.getapi.view_details?job_name=RE-2026-8358
```

2. Replace static invalid candidate with valid data.
3. Use recent date ranges instead of future/static dates.
4. Run a complete smoke test without interruption.
5. Target:

```text
HTTP failed rate: 0%
Business failure rate: 0%
Server error rate: 0%
Checks: >99%
```

### Phase 2: Harden Framework for CI

1. Standardize environment loading.
2. Make `script.js` the official CI and local entrypoint.
3. Add static validation commands for endpoint catalog and test data.
4. Improve failure diagnostics in reports.
5. Separate PR validation from live API performance tests.

### Phase 3: Enable CI/CD

1. Configure GitHub Secrets.
2. Use staging only.
3. Run manual smoke workflow.
4. Upload HTML and JSON reports.
5. Review failure behavior.
6. Enable scheduled baseline only after smoke is stable.

### Phase 4: Scale Testing

1. Establish baseline.
2. Run load test at controlled VU levels.
3. Add infrastructure monitoring correlation.
4. Identify bottlenecks.
5. Proceed to stress, endurance, and capacity testing.

## Final Recommendation

Do not enable full CI/CD performance gates yet.

The framework structure is good, but the current smoke test is still failing due to API/data validity. CI/CD should begin only after the smoke test is stable and the secrets/test-data prerequisites are complete.

Recommended immediate next milestone:

```text
Achieve a clean staging smoke test:
0% HTTP failures
0% business failures
0% server errors
complete 2-minute run without Ctrl+C
```

After that, enable GitHub Actions for manual staging smoke execution.
