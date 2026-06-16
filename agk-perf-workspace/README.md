# AGK k6 Performance Tests

This workspace contains k6 API load tests generated from `data/applications.csv`.

## Configuration

The root `.env` file contains:

- `URL`
- `API_KEY`
- `API_SECRET`

k6 also accepts overrides from shell environment variables with the same names.

## Run

Smoke test:

```bash
k6 run scripts/smoke.js
```

Load test:

```bash
k6 run scripts/load.js
```

Write APIs are disabled by default. To include mutating calls:

```bash
INCLUDE_WRITES=true k6 run scripts/load.js
```

## Files

- `data/applications.csv`: source API inventory from the spreadsheet.
- `data/test_data.js`: request parameters and document IDs used by the tests.
- `common/config.js`: `.env` parsing and runtime config.
- `common/client.js`: authenticated k6 HTTP client.
- `applications/hrops_food.js`: grouped HROps/Food API scenarios.
- `config/global_thresholds.js`: shared performance thresholds.
