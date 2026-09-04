const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const marketData = require("../services/marketData");
const { computeAttention, narrateWatchlist } = require("../services/changeDetector");

router.get("/", async (req, res) => {
  const deviceId = req.header("x-device-id");
  if (!deviceId) return res.status(400).json({ error: "Missing x-device-id header" });

  try {
    const items = await Stock.find({ deviceId }).lean();
    const enriched = items.map((item) => {
      const snapshot = marketData.getSnapshot(item.symbol);
      if (!snapshot) return null;
      return { symbol: item.symbol, attention: computeAttention(snapshot, item.lastSeen) };
    }).filter(Boolean);

    res.json({ summary: narrateWatchlist(enriched) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
