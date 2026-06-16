# Agnikul ERPNext/Frappe API Performance Testing Framework

Enterprise-grade k6 framework for Recruitment Management APIs and future ERPNext/Frappe custom applications.

## What Is Included

- Configuration-driven environments: local, staging, production
- CSV-driven API catalog generation from the recruitment API sheet
- CSV-driven runtime test data and workflow mix
- Modular k6 layers for HTTP, validation, metrics, and workflows
- SLA thresholds for smoke, baseline, load, stress, spike, endurance, SLA, and capacity tests
- Frappe token authentication
- Custom business and performance metrics
- GitHub Actions integration
- Prometheus, Grafana, node-exporter, and cAdvisor observability starter stack

## Project Structure

```text
config/                  Environment, scenario, and SLA config
data/generated/          Generated endpoint catalog from API CSV
data/test-data/          Runtime data and workflow mix CSVs
src/core/                Reusable k6 HTTP, metrics, validation, CSV, selection utilities
src/workflows/           Business workflow implementations
tests/                   k6 entrypoints
scripts/                 Framework utilities
observability/           Prometheus/Grafana infrastructure monitoring
docs/                    Runbook and lifecycle documentation
results/                 k6 summary outputs
```

## First Run

This framework requires Node.js 20 for local execution and GitHub Actions. Create a local `.env` file from `.env.example` and add your credentials.

```bash
npm run generate:recruitment

npm run smoke
```

## Test Types

Set `TEST_TYPE` to one of:

```text
smoke, baseline, load, stress, spike, endurance, sla, capacity
```

Example for 600-user expected load validation:

```bash
TARGET_VUS=600 npm run load
```

Credentials and defaults are loaded from `.env`. Values passed through `--env` or shell environment variables override `.env` values.

## HTML Report

After every run, the framework writes:

```text
results/html-report.html
results/<test-type>-report.html
testing/html-report.html
```

If you use Live Server from the project root, open:

```text
http://127.0.0.1:5500/testing/html-report.html
```

## Custom Metrics

- `response_status_code_distribution`
- `response_duration`
- `business_success_rate`
- `business_failure_rate`
- `workflow_duration`
- `user_journey_duration`
- `sla_breach_count`
- `validation_error_count`
- `server_error_count`
- `search_duration`
- `bulk_processing_duration`

## Safety

Only `GET` APIs are executed by default. Mutation endpoints are kept in the generated catalog but skipped unless `INCLUDE_MUTATIONS=true`.

## Next Applications

To add another ERPNext/Frappe application:

1. Add the application's API CSV.
2. Add a generator command or reuse `scripts/generate-endpoints.mjs` if the sheet format matches.
3. Add runtime parameter CSV data.
4. Implement workflows under `src/workflows/`.
5. Create a k6 entrypoint under `tests/`.
