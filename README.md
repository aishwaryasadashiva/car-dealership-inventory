# Car Dealership Inventory System

## About the Project

This project is a car dealership inventory system that helps manage vehicles available for sale. Users can register, log in, view available vehicles, search the inventory, and purchase vehicles. When a purchase is made, the available stock is updated automatically.

The system also supports admin-only operations for updating vehicle details, restocking vehicles, and removing vehicles from the inventory.

The backend is built using FastAPI and SQLite, with SQLAlchemy for database operations. The frontend uses React and TypeScript, and pytest is used to test backend functionality.

## Technologies Used

- Python and FastAPI
- SQLite and SQLAlchemy
- React and TypeScript
- Vite and Tailwind CSS
- Pytest

## Main Features

- User registration and login
- Authenticated access to the vehicle inventory
- Search vehicles by make and price range
- Purchase vehicles and automatically update stock
- Prevent purchases when a vehicle is out of stock
- Admin-only vehicle restocking, updating, and deletion
- Automated tests for backend API functionality

## Project Structure

```text
car-dealership-inventory/
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── frontend/
├── screenshots/
├── README.md
├── PROMPTS.md
└── TEST_REPORT.md
```

## How to Run the Project

### Prerequisites

Make sure Python 3, Node.js, and npm are installed.

### Backend Setup

From the project root, create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Set a private JWT secret for your local environment. Do not commit your real secret to Git:

```bash
export JWT_SECRET_KEY="your-local-secret"
```

Start the backend server from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

FastAPI's interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

Open a second terminal at the project root. If you activated the virtual environment in the first terminal, you can leave that terminal running the backend.

Run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal. Vite typically uses `http://localhost:5173`, but it may select another port if that one is already occupied.

### Running the Tests

Activate the virtual environment if it is not already active. From the project root, run:

```bash
cd backend
python3 -m pytest -q
```

The backend test suite was verified locally with 14 passing tests, zero failures, and one deprecation warning from the Starlette test-client integration.

The tests use a separate in-memory SQLite database so that test data remains isolated from the application's regular database.

### Verifying the Frontend

From the `frontend` directory, run:

```bash
npm run build
npm run lint
```

Both commands completed successfully during local verification.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/vehicles` | View vehicles |
| GET | `/api/vehicles/search` | Search vehicles |
| POST | `/api/vehicles` | Add a vehicle |
| POST | `/api/vehicles/{vehicle_id}/purchase` | Purchase a vehicle |
| POST | `/api/vehicles/{vehicle_id}/restock` | Restock a vehicle (admin only) |
| PUT | `/api/vehicles/{vehicle_id}` | Update vehicle details (admin only) |
| DELETE | `/api/vehicles/{vehicle_id}` | Remove a vehicle (admin only) |

Protected endpoints require authentication. Administrative operations are restricted to users with administrator privileges.

## Database

The application uses SQLite to store vehicle and user information. SQLAlchemy handles database operations.

The test suite uses a separate in-memory database, allowing tests to run without adding test records to the regular application database.

## Screenshots

Screenshots of the application and API documentation are available in the [`screenshots/`](screenshots/) directory:

- `inventory.png` — inventory dashboard
- `search.png` — vehicle search
- `purchase.png` — purchase flow
- `api-docs.png` — FastAPI API documentation

## AI Usage

I used AI assistance during development to understand errors, troubleshoot the test setup, and review parts of the implementation and documentation. I reviewed the suggestions and used them to help me work through development issues.

The `PROMPTS.md` file contains summaries of the AI assistance used. These summaries are not verbatim conversation transcripts.

## Test Report

The [`TEST_REPORT.md`](TEST_REPORT.md) file documents the backend test results, including the number of passing tests and the deprecation warning.

## Current Status

The following checks have been completed locally:

- Backend tests: 14 passed, zero failed, one deprecation warning.
- Frontend production build: passed.
- Frontend lint: passed.

These results reflect local verification. The project should also be reviewed against all assignment requirements before submission.
