# Performance Test Lifecycle

## 1. Smoke Test
Purpose: confirm credentials, endpoint availability, and framework wiring.

Command:

```bash
k6 run --env ENVIRONMENT=staging --env TEST_TYPE=smoke tests/recruitment.js
```

## 2. Baseline Test
Purpose: capture single-system behavior under a small stable load. Use this as the first SLA reference.

## 3. Load Test
Purpose: validate expected business load. For Agnikul's current planning number, ramp toward 300-600 users depending on the workflow mix.

## 4. Stress Test
Purpose: identify the saturation point beyond normal peak load.

## 5. Spike Test
Purpose: validate sudden login/dashboard/API surges.

## 6. Endurance Test
Purpose: detect memory leaks, worker exhaustion, queue buildup, database connection churn, and cache degradation.

## 7. SLA Validation
Purpose: run a controlled load profile against approved SLA thresholds and fail CI/CD when thresholds breach.

## 8. Capacity Analysis
Purpose: increase load in steps and correlate k6 metrics with CPU, memory, disk I/O, network, database, worker queue, and container metrics.

## 9. Final Performance Report
Minimum report sections:

- Test scope and excluded APIs
- Environment and build version
- Workload model and test data
- SLA threshold result
- Throughput, latency, error, and saturation analysis
- Endpoint-level bottlenecks
- Infrastructure utilization
- Capacity recommendation
- Risks, fixes, and retest plan
