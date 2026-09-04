require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const marketData = require("./services/marketData");
const watchlistRoutes = require("./routes/watchlist");
const summaryRoutes = require("./routes/summary");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.use("/api/watchlist", watchlistRoutes);
app.use("/api/summary", summaryRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-watchlist";
const TICK_INTERVAL = Number(process.env.PRICE_TICK_INTERVAL_MS) || 4000;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("   Make sure MongoDB is running locally, or set MONGO_URI to an Atlas connection string in .env");
    process.exit(1);
  }

  // Start the simulated live market data engine
  marketData.startEngine(TICK_INTERVAL);
  console.log(`📈 Market data engine ticking every ${TICK_INTERVAL}ms`);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
