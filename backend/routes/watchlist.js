const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const marketData = require("../services/marketData");
const { computeAttention } = require("../services/changeDetector");

// Every request must carry a deviceId (generated client-side, stored in localStorage).
// This is our stand-in for auth - it's what lets the watchlist persist
// across sessions without requiring a login.
function requireDeviceId(req, res, next) {
  const deviceId = req.header("x-device-id");
  if (!deviceId) return res.status(400).json({ error: "Missing x-device-id header" });
  req.deviceId = deviceId;
  next();
}

router.use(requireDeviceId);

// GET the full universe of stocks available to add
router.get("/universe", (req, res) => {
  res.json(marketData.listUniverse());
});

// GET the user's watchlist, enriched with live price + attention score
router.get("/", async (req, res) => {
  try {
    const items = await Stock.find({ deviceId: req.deviceId }).lean();

    const enriched = items.map((item) => {
      const snapshot = marketData.getSnapshot(item.symbol);
      if (!snapshot) return { ...item, error: "Symbol not found in market feed" };

      const attention = computeAttention(snapshot, item.lastSeen);

      return {
        _id: item._id,
        symbol: item.symbol,
        name: item.name || snapshot.name,
        intent: item.intent,
        note: item.note,
        addedAt: item.addedAt,
        lastSeen: item.lastSeen,
        live: {
          price: snapshot.price,
          volume: snapshot.volume,
          high52w: snapshot.high52w,
          low52w: snapshot.low52w,
          lastUpdated: snapshot.lastUpdated,
          sparkline: snapshot.history.slice(-20),
        },
        attention,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a stock to the watchlist
router.post("/", async (req, res) => {
  try {
    const { symbol, intent, note } = req.body;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const snapshot = marketData.getSnapshot(symbol.toUpperCase());
    if (!snapshot) return res.status(404).json({ error: "Unknown symbol" });

    const stock = await Stock.findOneAndUpdate(
      { deviceId: req.deviceId, symbol: symbol.toUpperCase() },
      {
        $setOnInsert: {
          deviceId: req.deviceId,
          symbol: symbol.toUpperCase(),
          name: snapshot.name,
          addedAt: new Date(),
          lastSeen: { price: snapshot.price, volume: snapshot.volume, seenAt: new Date() },
        },
        $set: {
          intent: intent || "just_curious",
          note: note || "",
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json(stock);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Already in watchlist" });
    res.status(500).json({ error: err.message });
  }
});

// PATCH update note/intent for a watchlist item, and/or mark it as "seen now"
// (call this when the user opens/expands a stock, so next time we diff from here)
router.patch("/:symbol/seen", async (req, res) => {
  try {
    const snapshot = marketData.getSnapshot(req.params.symbol.toUpperCase());
    if (!snapshot) return res.status(404).json({ error: "Unknown symbol" });

    const updated = await Stock.findOneAndUpdate(
      { deviceId: req.deviceId, symbol: req.params.symbol.toUpperCase() },
      { $set: { lastSeen: { price: snapshot.price, volume: snapshot.volume, seenAt: new Date() } } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not in watchlist" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:symbol", async (req, res) => {
  try {
    const { intent, note } = req.body;
    const updated = await Stock.findOneAndUpdate(
      { deviceId: req.deviceId, symbol: req.params.symbol.toUpperCase() },
      { $set: { ...(intent && { intent }), ...(note !== undefined && { note }) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not in watchlist" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove a stock from the watchlist
router.delete("/:symbol", async (req, res) => {
  try {
    const deleted = await Stock.findOneAndDelete({
      deviceId: req.deviceId,
      symbol: req.params.symbol.toUpperCase(),
    });
    if (!deleted) return res.status(404).json({ error: "Not in watchlist" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
