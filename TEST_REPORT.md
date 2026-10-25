# Backend Test Report

## Overview

The backend test suite was executed using pytest for the Car Dealership Inventory System.

**Date:** October 24, 2026

## Test Results

| Metric | Result |
|---|---:|
| Total tests passed | 14 |
| Total tests failed | 0 |
| Warnings | 1 |
| Execution time | 0.92 seconds |

## Areas Covered

The tests cover:

- Vehicle listing
- Authentication requirements
- Invalid access tokens
- Vehicle search by make
- Vehicle search by price range
- Vehicle purchases and stock reduction
- Rejection of purchases when stock is unavailable
- Admin-only restocking
- Admin-only vehicle deletion
- Admin and non-admin vehicle updates

## Test Environment

- Python
- FastAPI
- pytest
- SQLAlchemy
- SQLite in-memory database for tests

The test setup uses a temporary database to keep test data separate from the application's regular inventory database.

## Warning

The test run reported a Starlette deprecation warning concerning the HTTPX integration used by the test client. The warning did not cause any test failures.

## Command Used

```bash
python3 -m pytest -q
```

## Conclusion

## Conclusion

The backend test suite completed successfully, with 14 tests passing, zero failures, and one Starlette deprecation warning.

The frontend production build and ESLint checks were also completed successfully. These results reflect local verification of the project.