# End-to-End Event Ticketing Platform (TicketSaz)

This repository contains the enterprise microservices architecture, infrastructure-as-code (IaC), and automated deployment scripts for a scalable, highly available event ticketing platform.

## 🗺️ System Architecture & Ports Map
Once the dockerized environment is running, the core services and infrastructure will be exposed to the following local ports:
* **API Gateway Layer**: `http://localhost:8080` (Entry edge, handles rate limiting & auth filtering)
* **Identity Service (IAM)**: `http://localhost:3001` (JWT token issuance & authentication)
* **Reservation Engine**: `http://localhost:3002` (Redis temporary locking & Kafka event publishing)
* **Event Catalog Service**: `http://localhost:3003` (PostgreSQL metadata & read queries)
* **Billing & Checkout Service**: `http://localhost:3004` (Processes transaction & publishes OrderPaidEvent)
* **Notification Service**: `http://localhost:3005` (Kafka consumer, issues QR codes & sends SMS/Email)
* **Prometheus Telemetry**: `http://localhost:9090` (Infrastructure performance tracking)

## 🛠️ Prerequisites
Make sure you have the following installed on your host machine:
* [Docker Desktop](https://www.docker.com/products/docker-desktop) (and Docker Compose v2)
* [k6](https://k6.io/) (optional, required to run load and stress tests)

## 🚀 Local Environment Setup
Follow these simple steps to spin up the entire ecosystem:

1. **Clone this repository** to your local workspace:
   ```bash
   git clone <repository_url>
   cd Ticketing-Platform-Repo
   ```

2. **Start the full stack** (microservices + frontend):
   ```bash
   cd infrastructure
   docker compose up --build
   ```

3. **Open the web app** at **http://localhost:5173**

4. *(Optional)* Apply the database schema for PostgreSQL-backed events:
   ```bash
   docker exec -i ticketing-postgres psql -U postgres_admin -d ticketing < ../database-migrations/V1__baseline_schema.sql
   ```

## 🎨 Web Frontend

A React + Vite frontend lives in `frontend/`. It provides an interactive UI for the full booking journey:

| Step | Action |
|------|--------|
| 1 | Sign in with any username |
| 2 | Browse and select an event |
| 3 | Pick a seat on the interactive map |
| 4 | Pay (simulated gateway) |
| 5 | Receive your QR code ticket |

**Development mode** (backend in Docker, frontend with hot reload):
```bash
cd frontend
npm install
npm run dev
```
Then visit **http://localhost:5173** — Vite proxies `/api` to the gateway on port 8080.

See `frontend/README.md` for more details.