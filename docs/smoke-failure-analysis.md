# Smoke Test Failure Analysis

This document explains why the latest k6 smoke test failed and which APIs are most likely responsible.

No runtime code changes were made for this analysis.

## Test Output Reviewed

File reviewed:

```text
results/smoke-summary.json
results/smoke-raw-summary.json
```

Observed result:

```text
HTTP requests: 66
Failed HTTP requests: 10
HTTP failed rate: 15.15%
Business failure rate: 15.15%
Server error rate: 3.03%
Server error count: 2
Checks passed: 84.85%
Checks failed: 30
```

Important note:

The output shared mentions failure around 25%, but the latest available result file shows:

```text
15.15% HTTP request failure
```

The root cause pattern is still the same: a small number of APIs are failing repeatedly.

## High-Level Conclusion

The application is not slow.

Response times are good:

```text
HTTP p95: 116.23 ms
HTTP p99: 165.88 ms
```

The main problem is API correctness, not performance latency.

The failures are caused by specific APIs returning unsuccessful responses or invalid Frappe responses.

## Failed APIs

### 1. `job_post_getapi_view_details`

Workflow:

```text
job_post_search
candidate_deep_dive
```

API:

```text
/api/method/recruitment.config.getapi.view_details
```

Parameter used:

```text
job_name=RE-2026-8358
```

Failure count:

```text
8 failed requests
```

Evidence from raw summary:

```text
job_post_search::job_post_getapi_view_details status is expected: 0 passed, 6 failed
candidate_deep_dive::job_post_getapi_view_details status is expected: 0 passed, 2 failed
```

Likely cause:

The static candidate ID may not be valid in staging anymore.

Possible reasons:

- Candidate `CAD-09-25-01948` may not exist in staging; use job_name=RE-2026-8358 as the valid sample
- Candidate exists but the API user does not have permission to view it
- Candidate belongs to a different team, status, or module context
- API expects a different identifier format
- API returns `404` or another non-success status

Why this is likely:

The same API failed every time it was called. That usually means the input data is invalid or the API requires a different access condition.

Recommended validation:

Run the API manually using the same API key and parameter (use job_name):

```text
/api/method/recruitment.config.getapi.view_details?job_name=RE-2026-8358
```

Check whether the response is:

- 200 with valid `message`
- 404 not found
- Permission error
- Frappe exception
- HTML error page

## 2. `dashboard_dashboardapi_get_joblist`

Workflow:

```text
dashboard_review
```

API:

```text
/api/method/recruitment.config.dashboardapi.get_joblist
```

Parameters used:

```text
from_date=2026-01-01
to_date=2026-12-31
```

Failure count:

```text
1 failed request
```

Evidence from raw summary:

```text
dashboard_review::dashboard_dashboardapi_get_joblist status is expected: 0 passed, 1 failed
dashboard_review::dashboard_dashboardapi_get_joblist body is valid Frappe JSON: 0 passed, 1 failed
dashboard_review::dashboard_dashboardapi_get_joblist has no Frappe exception: 0 passed, 1 failed
```

Likely cause:

This API likely returned a server-side failure.

Why:

The run reported:

```text
server_error_count = 2
```

There are exactly two dashboard API requests that failed once each. These are the strongest candidates for the two server errors.

Possible reasons:

- API has a backend exception for the given date range
- Date range includes future dates and the backend logic does not handle it correctly
- Database query or aggregation fails for empty/future data
- Required filters are missing
- API has a bug in dashboard aggregation logic

Recommended validation:

Manually run:

```text
/api/method/recruitment.config.dashboardapi.get_joblist?from_date=2026-01-01&to_date=2026-12-31
```

Then try a safer range:

```text
from_date = today - 30 days
to_date = today
```

If the current/recent date range works but the future date range fails, the test data date range is the issue.

## 3. `dashboard_dashboardapi_candidate_analytic`

Workflow:

```text
dashboard_review
```

API:

```text
/api/method/recruitment.config.dashboardapi.candidate_analytic
```

Parameters used:

```text
from_date=2026-01-01
to_date=2026-12-31
```

Failure count:

```text
1 failed request
```

Evidence from raw summary:

```text
dashboard_review::dashboard_dashboardapi_candidate_analytic status is expected: 0 passed, 1 failed
dashboard_review::dashboard_dashboardapi_candidate_analytic body is valid Frappe JSON: 0 passed, 1 failed
dashboard_review::dashboard_dashboardapi_candidate_analytic has no Frappe exception: 0 passed, 1 failed
```

Likely cause:

This is also likely a backend/server-side issue or invalid date-range issue.

Possible reasons:

- Analytics API is failing for the selected date range
- API expects both dates in a specific format
- API does not handle no-data scenarios properly
- API throws a Frappe exception during aggregation

Recommended validation:

Manually run:

```text
/api/method/recruitment.config.dashboardapi.candidate_analytic?from_date=2026-01-01&to_date=2026-12-31
```

Then compare with:

```text
from_date = today - 30 days
to_date = today
```

## Passing APIs

The following workflows had successful checks in the available raw summary:

```text
quick_access
assignment_review
portal_review
```

Important passing APIs include:

```text
recruitment.config.getapi.get_users_role
recruitment.config.dashboardapi.get_fu_pending_count
recruitment.config.dashboardapi.get_pending_counts
recruitment.config.getapi.source_candidate
recruitment.config.getapi.candidate_screening
recruitment.config.getapi.interview
recruitment.config.getapi.hired
recruitment.config.getapi.get_candidate_card_counts
recruitment.config.getapi.referral_candidates
recruitment.config.getapi.inbound_candidates
```

This means the framework authentication and many Recruitment APIs are working.

## Why Checks Failed 30 Times

Each API call has three validations:

```text
1. Status is expected
2. Body is valid Frappe JSON
3. Response has no Frappe exception
```

There were 10 failed HTTP requests.

Each failed request caused 3 failed checks:

```text
10 failed requests x 3 checks = 30 failed checks
```

So the `30 failed checks` number matches the `10 failed requests`.

## Why Workflow Duration Threshold Failed

The failed threshold:

```text
workflow_duration
user_journey_duration
```

Observed:

```text
p95 = 12168 ms
```

Current SLA threshold:

```text
10000 ms
```

Important:

Workflow duration includes:

- Multiple API calls
- Think time between API calls
- Full journey duration

Example:

The `dashboard_review` workflow has 5 API calls.

If each step has think time between 800 ms and 2500 ms, the workflow can naturally exceed 10 seconds even when APIs are fast.

So this threshold breach is not necessarily an API performance issue.

It may mean the workflow SLA is too strict for journeys that intentionally include user think time.

## Senior Developer Assessment

### What is good

- k6 framework is executing correctly
- Authentication is working
- Most APIs are responding quickly
- Latency is excellent for smoke load
- Failures are isolated, not system-wide
- Assignment and quick-access journeys are stable

### What is concerning

- `view_details` fails every time it is called
- Two dashboard analytics APIs appear to return server-side errors
- Static test data is likely not reliable enough
- Current result does not include response bodies, so exact backend exception text is not visible from the summary alone

## Most Probable Root Causes

### Root Cause 1: Invalid static candidate data

Most likely affected API:

```text
recruitment.config.getapi.view_details
```

Current static value (replace with job_name):

```text
job_name=RE-2026-8358
```

This value may not exist or may not be accessible in staging.

### Root Cause 2: Dashboard APIs failing for future/static date range

Most likely affected APIs:

```text
recruitment.config.dashboardapi.get_joblist
recruitment.config.dashboardapi.candidate_analytic
```

Current static date range:

```text
2026-01-01 to 2026-12-31
```

This range includes future dates from the current execution date.

### Root Cause 3: API permission mismatch

The API key user may not have permission for certain candidate details or dashboard analytics.

This is less likely for dashboard APIs if some dashboard endpoints are passing, but still possible.

### Root Cause 4: Backend exceptions in Frappe methods

The two server errors indicate that at least two requests caused actual backend failures.

This should be checked in:

```text
Frappe error logs
bench logs
Nginx logs
application traceback
```

## Immediate Manual Checks

Run these APIs manually with the same API key used by k6:

```text
/api/method/recruitment.config.getapi.view_details?job_name=RE-2026-8358

/api/method/recruitment.config.dashboardapi.get_joblist?from_date=2026-01-01&to_date=2026-12-31

/api/method/recruitment.config.dashboardapi.candidate_analytic?from_date=2026-01-01&to_date=2026-12-31
```

For each response, record:

```text
HTTP status code
Response body
Whether response contains "message"
Whether response contains "exc" or "exception"
Whether response is JSON or HTML
```

## Recommended Next Step

Before changing framework code, first confirm response details using:

```bash
k6 run --http-debug=full \
  --env ENVIRONMENT=staging \
  --env STAGING_API_KEY="$STAGING_API_KEY" \
  --env STAGING_API_SECRET="$STAGING_API_SECRET" \
  --env TEST_TYPE=smoke \
  --env DURATION=30s \
  script.js
```

This will show the actual response status and body in the terminal.

Once the failing response bodies are known, we can decide whether the fix should be:

- Test data correction
- Permission correction
- Backend API fix
- SLA threshold adjustment
- Dynamic data preparation

## Final Conclusion

The smoke test is failing because 3 APIs are producing unsuccessful responses:

```text
1. recruitment.config.getapi.view_details
2. recruitment.config.dashboardapi.get_joblist
3. recruitment.config.dashboardapi.candidate_analytic
```

The largest contributor is:

```text
recruitment.config.getapi.view_details
```

This API alone accounts for:

```text
8 out of 10 failed requests
```

The most likely reason is invalid or inaccessible static candidate data.

The two dashboard failures are likely server-side exceptions or date-range handling issues.

Performance latency is not the current blocker. API correctness and test data validity must be fixed first.
