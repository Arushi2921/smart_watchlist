const mongoose = require("mongoose");

/**
 * One document per (user, stock) pair.
 *
 * `lastSeen` is the key field for "what changed since I last checked":
 * we snapshot price/volume at the moment the user views the stock,
 * so the NEXT time they open the app we can diff against it.
 *
 * `deviceId` stands in for full user auth, which we skip for the
 * hackathon's time budget - it's a random ID generated on first visit
 * and stored in the browser, so a user's watchlist persists across
 * sessions on the same browser, and could be extended to real login
 * without changing this schema.
 */
const StockSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    name: { type: String },

    // Optional personal context - the "why am I watching this" note
    intent: {
      type: String,
      enum: ["long_term", "swing_trade", "watching_dip", "just_curious"],
      default: "just_curious",
    },
    note: { type: String, default: "" },

    // Snapshot captured the last time the user viewed this stock
    lastSeen: {
      price: { type: Number, default: null },
      volume: { type: Number, default: null },
      seenAt: { type: Date, default: null },
    },

    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StockSchema.index({ deviceId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model("Stock", StockSchema);
