# Car Dealership Inventory System

## About the Project

This project is a car dealership inventory system that helps manage vehicles available for sale. Users can register, log in, view the available cars, search by make or price, and purchase a vehicle. When a purchase is made, the available stock is updated automatically.

The system also has admin-only operations for updating vehicle details, restocking vehicles, and removing vehicles from the inventory.

I built the backend using FastAPI and SQLite, and the frontend using React and TypeScript. I used SQLAlchemy to interact with the database and pytest to test the backend functionality.

## Technologies Used

- Python and FastAPI
- SQLite and SQLAlchemy
- React and TypeScript
- Vite and Tailwind CSS
- Pytest

## Main Features

- User registration and login
- View the vehicle inventory
- Search vehicles by make and price range
- Purchase vehicles and update stock
- Prevent purchases when a vehicle is out of stock
- Restrict restocking, updating, and deleting vehicles to admins
- Automated tests for the backend API

## Project Structure

```text
car-dealership-inventory/
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── frontend/
├── README.md
└── PROMPTS.md
```

## How to Run the Project

### Backend Setup

First, make sure Python 3 is installed. From the project root, create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Move into the backend folder and install the dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Set the JWT secret before starting the backend. Use a private secret for your own environment and don't commit it to Git.

```bash
export JWT_SECRET_KEY="your-local-secret"
```

Start the server:

```bash
uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`. You can use `http://127.0.0.1:8000/docs` to view and try the API endpoints.

### Frontend Setup

Open another terminal and run:

```bash
cd ~/Projects/car-dealership-inventory/frontend
npm install
npm run dev
```

Open the local address shown in the terminal. By default, Vite usually uses `http://localhost:5173`.

## Running the Tests

With the virtual environment activated, open a terminal in the backend folder and run:

```bash
python3 -m pytest -q
```

I ran the backend tests on October 24, 2026. All 14 tests passed, with no failures. One deprecation warning was reported by the Starlette test client integration.

The tests use a temporary SQLite database so that test data stays separate from the application's regular database.

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

## Database

The application uses SQLite to store vehicle and user information. SQLAlchemy handles database operations.

The test suite uses a separate in-memory database, allowing tests to run without adding test records to the regular inventory database.

## My AI Usage

I used AI assistance while working on this project to understand errors, troubleshoot the test setup, and review parts of the implementation and documentation. I reviewed the suggestions and used them to help me work through problems during development.

The `PROMPTS.md` file should contain the actual prompts and AI interactions required by the assignment.

## Current Status

The backend test suite passes all 14 tests. I still need to complete the remaining checks for the frontend and submission materials before treating the project as finished.
