# Smart Market Watchlist

> "Don't build the obvious watchlist. Build the version you believe should exist."

A watchlist that doesn't just show you prices — it tells you **what actually changed
since you last checked**, and lets everything else fade quietly into the background.

---

## Quick start (for tomorrow)

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set `MONGO_URI`:
- **Easiest**: create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas/register
  (takes ~3 minutes, no credit card), then paste the connection string in.
- **Or**: if you have MongoDB installed locally, run `mongod` in a separate terminal and
  leave the default `mongodb://127.0.0.1:27017/smart-watchlist`.

Then:
```bash
npm install   # already done if you're using the folder as-delivered
npm run dev   # starts the server on http://localhost:5000 with nodemon
```

You should see:
```
✅ MongoDB connected
📈 Market data engine ticking every 4000ms
🚀 Server running on http://localhost:5000
```

### 2. Frontend

In a second terminal:
```bash
cd frontend
npm install   # already done if using the folder as-delivered
npm run dev   # starts Vite dev server, usually on http://localhost:5173
```

Open the printed URL in your browser. Add a few stocks, wait ~10-20 seconds
(the simulated market updates every 4s), and watch the Attention Scores move.

---

## What this actually is

Live NSE/BSE market data APIs need paid access or credentials most hackathon teams
don't have on day one. Rather than block on that, this project simulates a realistic
live market feed (`backend/services/marketData.js`) — random-walk price/volume ticks
seeded from real stock names and approximate real prices — so the **entire product
experience is genuinely demoable end-to-end**, including the parts a real API can't
give you for free (like engineered volume spikes to show off the detection logic).

Swapping in a real data source later only requires changing what's inside `tick()` —
everything downstream (the Attention Score engine, the routes, the UI) only depends
on the `{ symbol, price, volume, high52w, low52w }` shape, not on where it comes from.

---

## The core design decision: what counts as a "meaningful change"?

We deliberately rejected a flat "alert if price moves >X%" rule, because a 2% move
means very different things for a calm blue-chip (SBI) vs. a volatile one (Tata Motors).

Instead, `backend/services/changeDetector.js` computes a **0–100 Attention Score**
per stock, relative to that stock's *own* recent behavior:

1. **Price surprise** — how many "typical daily swings" has the price moved since the
   user last looked, scaled by that stock's own recent volatility (not a flat %).
2. **Volume surprise** — how unusual is current volume vs. its own rolling average.
3. **Level crossing** — is it at/near a 52-week high or low.

These combine into one score, plus a plain-English reason ("Up 5.3% since you last
checked — larger than its typical swing"). Stocks scoring ≥30 land in a **"Needs your
attention"** section up top; everything else collapses into a quiet **"Stable"**
section below. This restraint — deliberately *not* highlighting everything — is the
actual product decision, not a missing feature.

## How state persists across sessions/devices

Every watchlist item is a MongoDB document keyed by a `deviceId` (a random ID
generated once and stored in the browser's `localStorage`). This means:
- The watchlist survives closing the tab / restarting the browser (MongoDB is the
  source of truth, not localStorage — localStorage only carries the identity token).
- It's a deliberate, time-boxed simplification instead of building full auth in a
  one-day hackathon — the schema is ready to swap `deviceId` for a real `userId` the
  moment login is added, with no other changes needed.

Each document also stores a `lastSeen` snapshot (price/volume at the moment the user
last viewed that stock) — this is *the* mechanism that makes "what changed since I
left" possible at all. Clicking "Mark as seen" updates this snapshot.

## Handling stale/delayed/conflicting data

- Every price snapshot carries a `lastUpdated` timestamp shown in the UI, so users
  always know the recency of what they're looking at instead of assuming it's live-live.
- If the backend is unreachable, the frontend shows an explicit banner rather than
  silently displaying stale numbers as if they were current.
- Because the market data engine is a single in-memory process feeding all users,
  there's no risk of conflicting reads across users for the same stock — a real
  production version would replace this with one shared polling job per unique symbol
  (not one poller per user) writing into a shared cache, for the same reason.

## Where we kept it simple on purpose

- No real authentication — `deviceId` + localStorage instead, explained above.
- No WebSockets — polling every 5s is simple, debuggable, and plenty fast for a
  human glancing at a watchlist; we said so explicitly rather than over-engineering
  real-time infra we didn't have time to demo reliably.
- Fixed universe of 10 well-known stocks rather than open-ended search — keeps the
  demo focused on the change-detection logic, which is the actual point of the project.

## How it would scale (explained, not necessarily built)

- Poll each unique stock symbol **once**, server-side, regardless of how many users
  are watching it — fan the result out to all subscribers from a shared cache
  (Redis in production) instead of one API call per user per stock.
- Move the Attention Score computation to run once per tick per symbol (not once per
  user request) and cache the result, since it only depends on the symbol's own
  history, not on who's asking.
- Shard `deviceId`/`userId` watchlist documents normally in MongoDB — this data
  access pattern (small per-user documents, indexed by owner) scales horizontally
  without special handling.

---

## Project structure

```
smart-watchlist/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── models/Stock.js            # Mongoose schema for a watchlist item
│   ├── services/marketData.js     # Simulated live price/volume engine
│   ├── services/changeDetector.js # Attention Score + narrated summary logic
│   ├── routes/watchlist.js        # CRUD + mark-seen endpoints
│   ├── routes/summary.js          # Whole-watchlist narrated summary endpoint
│   └── .env.example
└── frontend/
    ├── src/App.jsx                 # Dashboard layout, polling
    ├── src/components/
    │   ├── SummaryBanner.jsx       # "Your watchlist, narrated" sentence
    │   ├── AddStockForm.jsx        # Add stock + intent tag + note
    │   └── WatchlistCard.jsx       # Per-stock card: score, sparkline, note
    └── src/api/client.js           # Axios client + deviceId management
```
