# Agnikul k6 Framework Runbook

## Generate Endpoint Catalog

```bash
npm run generate:recruitment
```

The generator reads `Recruitment_ v1.2.5 - Sheet1.csv` and writes `data/generated/recruitment.endpoints.json`.

## Run Smoke Test

Create `.env` from `.env.example` and fill the staging credentials:

```bash
npm run smoke
```

## Run Expected Load Test

```bash
TARGET_VUS=600 npm run load
```

The framework can read credentials from `.env` directly. Command-line `--env` values and exported shell variables take priority over `.env`.

## Run With Prometheus Remote Write

Start monitoring:

```bash
docker compose -f observability/docker-compose.yml up -d
```

Run k6:

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
k6 run -o prometheus_remote_write=$K6_PROMETHEUS_RW_SERVER_URL \
  --env ENVIRONMENT=staging \
  --env TEST_TYPE=load \
  --env TARGET_VUS=600 \
  script.js
```

## HTML Report

After the run, open:

```text
testing/html-report.html
```

If you are using VS Code Live Server from the project root, open:

```text
http://127.0.0.1:5500/testing/html-report.html
```

Open Grafana at `http://localhost:3001` and Prometheus at `http://localhost:9090`.

## Mutation API Safety

Mutation APIs are excluded by default. Enable them only after creating dedicated payload CSV files and test records:

```bash
k6 run --env INCLUDE_MUTATIONS=true --env TEST_TYPE=smoke tests/recruitment.js
```
