# INSY7314 POE Backend

>A small Node.js/Express backend used for the INSY7314 project. It exposes authentication, payment, employee and manager endpoints, uses MongoDB for persistence, and includes tests with Jest.

---

## Table of contents

- Project overview
- Tech stack
- Prerequisites
- Environment variables
- Install
- Run (development & production)
- Seed data
- Tests & Coverage
- API endpoints (summary)
- Project structure
- Notes & next steps

## Project overview

This repository implements a backend for a simple banking/payment workflow used for an academic project. Key features:

- User registration, login and JWT-based auth
- Multi-factor authentication enable/verify flows
- Payment creation (transactions saved to MongoDB)
- Employee and manager routes for verifying and handling transactions
- HTTPS server (local `ssl/` folder included for development)
- Jest tests and coverage reports included

## Tech stack

- Node.js (Express)
- MongoDB (mongoose)
- JSON Web Tokens (JWT)
- Jest & Supertest for tests

## Prerequisites

- Node.js (v16+ recommended) and npm installed
- A running MongoDB instance (URI available as `MONGO_URI`)

Note: the project uses an HTTPS server by default (reads `ssl/key.pem` and `ssl/cert.pem`). Remove or update the HTTPS section in `server.js` if you prefer plain HTTP during development.

## Environment variables

Create a `.env` file in the project root with at least the following variables:

- MONGO_URI - MongoDB connection string
- JWT_SECRET - secret used for signing JWT tokens
- PORT - optional, default 5000
- NODE_ENV - optional (e.g. `development` | `production` | `test`)

Example .env (do NOT commit secrets):

```
MONGO_URI=mongodb://localhost:27017/insy-db
JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

## Install

Open a PowerShell terminal in the repository root and run:

```cmd
npm install
```

## Run

Development (auto-restarts with changes):

```cmd
npm run dev
```

Production (start server):

```cmd
npm start
```

The server uses HTTPS (reads `ssl/key.pem` and `ssl/cert.pem`) and will listen on `https://localhost:<PORT>` (default port 5000).

If you'd rather run without HTTPS for local development, edit `server.js` to use `app.listen(PORT)` or use a simple proxy in front.

## Seed data

There is a seeder to create example employees at `seed/seedEmployee.js`.

Run it with:

```cmd
node seed/seedEmployee.js
```

This will connect using `process.env.MONGO_URI` and create a few sample employee accounts.

## Tests & Coverage

Run the test suite (Jest):

```cmd
npm test
```

Coverage reports are generated in the `coverage/` and `lcov-report/` folders. There are already coverage artifacts in the repo.

## API endpoints (summary)

The routes are mounted in `app.js` with these prefixes:

- `POST /api/auth/register` - register a new user (validation middleware applied)
- `POST /api/auth/login` - login and receive JWT (rate limited)
- `POST /api/auth/enable-mfa/initiate` - begin enabling MFA (protected)
- `POST /api/auth/enable-mfa/verify` - verify MFA code (protected)
- `POST /api/auth/refresh` - refresh token
- `POST /api/auth/logout` - logout

- `POST /api/payments/` - create a new payment/transaction (protected)

- `POST /api/employee/login` - employee login
- `GET  /api/employee/transactions` - get pending transactions (protected)
- `PUT  /api/employee/verify/:id` - verify a transaction (protected)
- `PUT  /api/employee/submit/:id` - submit transaction to SWIFT (protected)

- `GET  /api/user/transactions` - get transactions for the logged-in user (protected)

- `POST /api/manager/add-employee` - add employee (protected, authorize manager)
- `GET  /api/manager/all-employees` - list all employees (protected, authorize manager)

For full details of request bodies and responses, inspect the corresponding controller files in `Controllers/` and tests in `__tests__/` which provide usage examples.

## Project structure

Top-level layout (important folders/files):

- `app.js` - Express app configuration and route mounting
- `server.js` - database connection and HTTPS server bootstrap
- `Controllers/` - route handlers
- `Routes/` - route definitions (authRoute, paymentRoutes, employeeRoutes, userRoutes, managerRoutes)
- `Models/` - Mongoose models (User, Employee, Transaction)
- `Middleware/` - auth, validation and rate limiting middleware
- `seed/` - seed scripts
- `ssl/` - development SSL certificate + key (used by `server.js`)
- `__tests__/` - Jest tests
- `coverage/` - code coverage output

## Useful npm scripts

- `npm start` - start server (uses `server.js`)
- `npm run dev` - run server with nodemon
- `npm test` - run Jest tests and create coverage

## Notes & next steps

- Security: ensure `JWT_SECRET` and DB credentials are stored in a secure place and not committed.
- CI: consider adding GitHub Actions to run tests and coverage on push.
- Docker: create a `Dockerfile` and `docker-compose` for easier local setup (MongoDB + app).
- HTTPS: for dev you can continue using the `ssl/` local certs; in production use trusted certs.

If you want, I can also:

- add a small `.env.example` file
- add a `Makefile` or `npm` script to run the seeder
- add a `Dockerfile` and `docker-compose.yml`

## License & support

See `package.json` for basic metadata. Open an issue on the repository for support: https://github.com/ST10254797/insy7314-poe-backend/issues

---

Generated: README added by automated assistant — feel free to ask for edits or extra sections (diagrams, endpoint examples, or a `.env.example`).
