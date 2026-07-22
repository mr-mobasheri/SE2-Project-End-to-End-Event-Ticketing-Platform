# TicketSaz Frontend

Beautiful React UI for the end-to-end ticketing flow: **Login → Events → Seat Selection → Payment → QR Ticket**.

## Quick Start (with Docker backend)

1. Start the backend stack from the `infrastructure` folder:
   ```bash
   cd infrastructure
   docker compose up --build
   ```

2. Install and run the frontend dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open **http://localhost:5173** in your browser.

## Full Docker Stack (frontend included)

```bash
cd infrastructure
docker compose up --build
```

Then open **http://localhost:5173** — nginx serves the built app and proxies `/api` to the gateway.

## User Flow

1. **Sign In** — enter any username (e.g. `ali`)
2. **Browse Events** — pick an upcoming event
3. **Select a Seat** — interactive seat map (VIP / Premium / Standard)
4. **Pay** — simulated checkout with 10-minute seat hold timer
5. **Get Ticket** — cryptographic QR code issued via the notification service

## Tech Stack

- React 18 + Vite
- React Router for multi-step navigation
- CSS custom properties (no heavy UI framework)
- Proxies API calls to `http://localhost:8080`
