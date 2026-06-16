# Folder Structure Explanation

This document explains the purpose of each folder and file in the k6 performance testing framework.

The goal of this framework is to keep performance testing:

- Configuration-driven
- Reusable
- Easy to maintain
- Safe for ERPNext/Frappe applications
- Ready for CI/CD and reporting

## Root Level Files

### `README.md`

Purpose:

This is the main introduction document for the framework. It explains what the framework contains, how to run tests, what metrics are captured, and how new applications can be added.

What happens without it:

New team members will not know how to start using the framework. They may depend on verbal instructions or guess the commands.

Why it is important:

It acts as the entry point for the project. Anyone opening the repository should first understand the framework from this file.

---

### `package.json`

Purpose:

This file defines project metadata and useful commands such as:

- Generate endpoint catalog
- Inspect k6 test
- Run smoke test
- Run load test
- Run stress test
- Run endurance test

What happens without it:

You can still run k6 manually, but there will be no standard commands. Different people may run tests differently.

Why it is important:

It standardizes execution commands across local machines and CI/CD.

---

### `.env.example`

Purpose:

This is a sample environment variable file. It shows what credentials, environment names, SLA values, and test settings are required.

What happens without it:

Users may not know which environment variables are needed to run the framework.

Why it is important:

It helps testers set up their local machine without exposing real secrets.

Important:

Real API keys and secrets should never be committed to Git.

---

### `.gitignore`

Purpose:

This file tells Git which files should not be committed.

Examples:

- Test result files
- `.env`
- `node_modules`
- OS-specific temporary files

What happens without it:

Sensitive files, temporary files, or large generated files may accidentally get committed.

Why it is important:

It protects credentials and keeps the repository clean.

---

### `Recruitment_ v1.2.5 - Sheet1.csv`

Purpose:

This is the source API inventory file for Recruitment Management. It contains API endpoint details such as:

- Module
- Endpoint
- Version
- HTTP method
- Mandatory parameters
- Optional parameters
- Description
- Sample response

What happens without it:

The framework cannot regenerate the recruitment endpoint catalog automatically.

Why it is important:

It acts as the business/API contract source. When APIs change, this file can be updated and the generated catalog can be refreshed.

---

### `prompt.text`

Purpose:

This file contains the original requirement/prompt used to create the framework.

What happens without it:

The framework will still run. This file is not required for execution.

Why it is important:

It is useful as a reference to understand the original scope and objectives.

---

## `config/`

The `config` folder contains framework-level configuration.

It controls:

- Environment selection
- SLA thresholds
- Test scenarios
- Load profiles

---

### `config/environments.js`

Purpose:

This file defines environment-specific details:

- Local environment
- Staging environment
- Production environment
- Base URL
- API key
- API secret
- HTTP timeout

What happens without it:

k6 will not know which ERPNext/Frappe environment to test or which credentials to use.

Why it is important:

It avoids hardcoding URLs and credentials inside test scripts.

Example:

Instead of writing the staging URL directly inside every test, the test reads it from this file.

---

### `config/slas.js`

Purpose:

This file defines SLA limits and k6 thresholds.

Examples:

- HTTP response p95 should be less than 2000 ms
- HTTP response p99 should be less than 5000 ms
- Error rate should be less than 1%
- Business failure rate should be less than 2%

What happens without it:

The test may run, but it will not clearly pass or fail based on performance expectations.

Why it is important:

Performance testing is not only about generating load. It must also validate whether the system meets agreed performance targets.

---

### `config/scenarios.js`

Purpose:

This file defines different performance test types:

- Smoke test
- Baseline test
- Load test
- Stress test
- Spike test
- Endurance test
- SLA validation
- Capacity test

What happens without it:

You would need to manually define virtual users, duration, ramp-up, and ramp-down every time.

Why it is important:

It standardizes the performance testing lifecycle. Everyone can run the same type of test using `TEST_TYPE`.

Example:

```bash
k6 run --env TEST_TYPE=load tests/recruitment.js
```

---

## `data/`

The `data` folder contains test data used by the framework.

There are two types of data:

- Generated endpoint data
- Runtime test data

---

## `data/generated/`

This folder contains files generated from source API documents.

---

### `data/generated/recruitment.endpoints.json`

Purpose:

This is the normalized endpoint catalog generated from the recruitment CSV.

It contains structured endpoint details:

- Endpoint ID
- Application name
- Module name
- HTTP method
- API path
- Mandatory parameters
- Optional parameters
- Expected status
- Category

What happens without it:

The k6 workflow cannot know which endpoints are available or how to call them.

Why it is important:

k6 works better with clean structured JSON than with a large business CSV containing multi-line sample responses.

Important:

This file should be regenerated whenever the source API CSV changes.

---

## `data/test-data/`

This folder contains the runtime data used during test execution.

---

### `data/test-data/recruitment.params.csv`

Purpose:

This file contains parameter values used by recruitment APIs.

Examples:

- `page`
- `limit`
- `from_date`
- `to_date`
- `requested_by`
- `tab`
- `candidate_name`
- `team`
- `sub_team`
- `role`
- `job_name`

What happens without it:

APIs that need parameters may run with empty or invalid values.

Why it is important:

It separates test data from test logic. If a candidate ID or date range changes, you can update the data file instead of changing the code.

Current state:

The values are mostly static.

Future dynamic approach:

This file can be generated before test execution using fresh ERPNext/Frappe data.

---

### `data/test-data/workflow.mix.csv`

Purpose:

This file controls the business workload distribution.

It answers the question:

How often should each user journey run?

Examples:

- Dashboard review: 25%
- Job post search: 20%
- Assignment review: 20%
- Candidate deep dive: 10%

What happens without it:

All workflows may run equally or the script would need hardcoded business distribution.

Why it is important:

Real users do not use all features equally. This file helps simulate realistic business usage.

---

## `scripts/`

The `scripts` folder contains utility scripts used outside k6 execution.

---

### `scripts/generate-endpoints.mjs`

Purpose:

This script reads the recruitment API CSV and generates the endpoint JSON catalog.

Flow:

```text
Recruitment CSV -> generator script -> recruitment.endpoints.json
```

What happens without it:

Endpoint details would need to be manually maintained in JSON, which is error-prone.

Why it is important:

It supports the zero-hardcoding goal. API details come from the CSV instead of being typed directly inside k6 scripts.

---

## `src/`

The `src` folder contains reusable framework code.

This is where the core logic lives.

---

## `src/core/`

This folder contains reusable utilities used by all applications and workflows.

The files here should remain generic and application-independent.

---

### `src/core/csv.js`

Purpose:

This file reads CSV content and converts it into JavaScript objects.

What happens without it:

k6 cannot easily read runtime CSV files like `recruitment.params.csv` and `workflow.mix.csv`.

Why it is important:

It allows the framework to be data-driven.

---

### `src/core/httpClient.js`

Purpose:

This is the reusable HTTP client for calling ERPNext/Frappe APIs.

It handles:

- Base URL
- Frappe token authentication
- Headers
- Query parameters
- Request body
- Response validation
- Metric recording

What happens without it:

Every workflow would need to manually write HTTP request logic.

Why it is important:

It avoids duplicate code and ensures all API calls follow the same standard.

---

### `src/core/metrics.js`

Purpose:

This file defines custom k6 metrics.

Examples:

- Business success rate
- Business failure rate
- Workflow duration
- User journey duration
- SLA breach count
- Validation error count
- Server error count
- Search duration
- Bulk processing duration

What happens without it:

You would only get basic k6 metrics and miss important business-level performance indicators.

Why it is important:

Enterprise performance testing needs both technical and business metrics.

---

### `src/core/selection.js`

Purpose:

This file contains helper functions for selecting random or weighted data.

Examples:

- Pick a workflow based on weight
- Pick a random think time between two values

What happens without it:

Workflow selection may become hardcoded or unrealistic.

Why it is important:

It helps simulate real user behavior instead of robotic equal distribution.

---

### `src/core/summary.js`

Purpose:

This file builds the final test summary report data.

It extracts important values such as:

- p95 response time
- p99 response time
- Error rate
- Business failure rate
- Server error rate
- SLA breach count

What happens without it:

k6 will still produce raw output, but it will be harder to read and share.

Why it is important:

It creates a cleaner executive-style performance summary.

---

### `src/core/validators.js`

Purpose:

This file validates ERPNext/Frappe API responses.

It checks:

- Expected HTTP status
- Valid JSON body
- Expected response key
- Frappe exceptions
- Server-side error messages

What happens without it:

An API might return HTTP 200 but still contain a Frappe business exception, and the test may incorrectly treat it as success.

Why it is important:

ERPNext/Frappe APIs can return application-level errors inside the response body. This validator catches those failures.

---

## `src/workflows/`

This folder contains business workflow scripts.

Workflows represent real user journeys.

---

### `src/workflows/recruitment.js`

Purpose:

This file defines Recruitment Management user journeys.

Examples:

- Quick access
- Dashboard review
- Job post search
- Assignment review
- Candidate deep dive
- Portal review

What happens without it:

The framework would only call individual APIs without business meaning.

Why it is important:

Performance testing should simulate how users actually use the application, not only hit endpoints randomly.

---

## `tests/`

The `tests` folder contains k6 entrypoint files.

---

### `tests/recruitment.js`

Purpose:

This is the main k6 test file for Recruitment Management.

It connects:

- Scenario config
- Environment config
- Recruitment workflow
- Setup logging
- Final summary generation

What happens without it:

k6 does not have a script to execute.

Why it is important:

This is the file you pass to the `k6 run` command.

Example:

```bash
k6 run --env ENVIRONMENT=staging --env TEST_TYPE=smoke tests/recruitment.js
```

---

## `.github/workflows/`

This folder contains GitHub Actions workflows.

---

### `.github/workflows/k6-performance.yml`

Purpose:

This file runs performance tests from GitHub Actions.

It supports:

- Manual test execution
- Pull request smoke validation
- Scheduled test execution
- Uploading result artifacts

What happens without it:

Performance tests must be run manually from a local machine or server.

Why it is important:

It enables CI/CD integration and repeatable performance validation.

---

## `observability/`

This folder contains monitoring setup files.

Performance testing should always be correlated with infrastructure metrics.

---

### `observability/docker-compose.yml`

Purpose:

This file starts monitoring tools:

- Prometheus
- Grafana
- Node Exporter
- cAdvisor

What happens without it:

You may know API response time, but you may not know whether CPU, memory, disk, network, or containers caused the bottleneck.

Why it is important:

It helps identify infrastructure bottlenecks during load tests.

---

### `observability/prometheus.yml`

Purpose:

This is the Prometheus scrape configuration.

It tells Prometheus where to collect metrics from.

What happens without it:

Prometheus will start but may not collect the correct system/container metrics.

Why it is important:

It connects the monitoring stack to infrastructure metric sources.

---

## `docs/`

The `docs` folder contains project documentation.

---

### `docs/runbook.md`

Purpose:

This document explains how to run the framework.

It includes:

- Generate endpoint catalog
- Run smoke test
- Run load test
- Run with Prometheus
- Mutation API safety

What happens without it:

Users may know the framework exists but may not know the exact operating steps.

Why it is important:

It is the operational guide for testers.

---

### `docs/performance-test-lifecycle.md`

Purpose:

This document explains the performance testing lifecycle.

It covers:

- Smoke test
- Baseline test
- Load test
- Stress test
- Spike test
- Endurance test
- SLA validation
- Capacity analysis
- Final report

What happens without it:

The team may run tests randomly without following a proper testing process.

Why it is important:

It brings industry-standard structure to performance testing.

---

### `docs/folder-structure.md`

Purpose:

This document explains the folder and file structure of the framework.

What happens without it:

New users may find the framework difficult to understand.

Why it is important:

It helps onboarding and maintenance.

---

## `results/`

This folder stores k6 output files.

---

### `results/.gitkeep`

Purpose:

Git does not track empty folders. This file keeps the `results` folder available in the repository.

What happens without it:

The folder may not exist after cloning the repository.

Why it is important:

The framework writes summary output into this folder after test execution.

---

## High-Level Execution Flow

The framework execution flow is:

```text
1. Update Recruitment API CSV
2. Generate endpoint catalog JSON
3. Select environment
4. Select test type
5. Load runtime test data
6. Pick workflow based on workflow mix
7. Pick endpoint parameters
8. Call ERPNext/Frappe APIs
9. Validate responses
10. Record k6 and custom metrics
11. Validate SLA thresholds
12. Generate summary reports
```

## Most Important Files for Test Execution

These files are required for a normal Recruitment Management test run:

- `tests/recruitment.js`
- `config/environments.js`
- `config/scenarios.js`
- `config/slas.js`
- `data/generated/recruitment.endpoints.json`
- `data/test-data/recruitment.params.csv`
- `data/test-data/workflow.mix.csv`
- `src/core/httpClient.js`
- `src/core/metrics.js`
- `src/core/validators.js`
- `src/workflows/recruitment.js`

If any of these are missing, the test may fail or run incorrectly.

## Simple Summary

The framework is divided like this:

```text
config/        Controls where, how long, and with what SLA to test
data/          Provides API details and test input data
scripts/       Generates structured data from CSV
src/core/      Reusable framework engine
src/workflows/ Business user journeys
tests/         k6 entrypoint scripts
docs/          Human documentation
observability/ Infrastructure monitoring setup
results/       Test output location
```

In simple words:

The `config` folder controls the test.

The `data` folder feeds the test.

The `src` folder runs the test logic.

The `tests` folder starts the test.

The `results` folder stores the output.

The `docs` folder explains how everything works.
