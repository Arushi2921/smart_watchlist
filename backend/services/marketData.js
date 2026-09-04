/**
 * Simulated Market Data Engine
 * ------------------------------------------------------------
 * Live NSE/BSE APIs generally require paid access or credentials.
 * For a hackathon demo, this module simulates realistic price and
 * volume ticks using a random-walk model seeded from real stock
 * names and approximate real base prices (as of ~2026).
 *
 * SWAPPING IN A REAL API LATER:
 * Replace the body of `tick()` with a fetch call to your real data
 * source, and keep the same shape: { symbol, price, volume, high52w, low52w }.
 * Everything downstream (change detection, routes) only depends on
 * that shape, not on how it's produced.
 */

const UNIVERSE = [
  { symbol: "RELIANCE", name: "Reliance Industries", basePrice: 2950, baseVolume: 5_000_000, dailyVolPct: 1.4 },
  { symbol: "TCS", name: "Tata Consultancy Services", basePrice: 4150, baseVolume: 2_000_000, dailyVolPct: 1.1 },
  { symbol: "INFY", name: "Infosys", basePrice: 1900, baseVolume: 3_500_000, dailyVolPct: 1.6 },
  { symbol: "HDFCBANK", name: "HDFC Bank", basePrice: 1720, baseVolume: 6_000_000, dailyVolPct: 1.2 },
  { symbol: "ICICIBANK", name: "ICICI Bank", basePrice: 1290, baseVolume: 7_500_000, dailyVolPct: 1.5 },
  { symbol: "TATAMOTORS", name: "Tata Motors", basePrice: 980, baseVolume: 9_000_000, dailyVolPct: 2.4 },
  { symbol: "ITC", name: "ITC Limited", basePrice: 465, baseVolume: 8_000_000, dailyVolPct: 0.9 },
  { symbol: "SBIN", name: "State Bank of India", basePrice: 830, baseVolume: 10_000_000, dailyVolPct: 1.8 },
  { symbol: "WIPRO", name: "Wipro", basePrice: 545, baseVolume: 4_000_000, dailyVolPct: 1.7 },
  { symbol: "LT", name: "Larsen & Toubro", basePrice: 3650, baseVolume: 2_500_000, dailyVolPct: 1.3 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", basePrice: 7200, baseVolume: 1_800_000, dailyVolPct: 1.9 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", basePrice: 2400, baseVolume: 1_200_000, dailyVolPct: 0.8 },
  { symbol: "MARUTI", name: "Maruti Suzuki", basePrice: 12500, baseVolume: 700_000, dailyVolPct: 1.5 },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", basePrice: 1780, baseVolume: 2_200_000, dailyVolPct: 1.3 },
  { symbol: "ADANIENT", name: "Adani Enterprises", basePrice: 2900, baseVolume: 4_500_000, dailyVolPct: 2.8 },
];

// In-memory live state: symbol -> { price, volume, history: [...], high52w, low52w }
const state = new Map();

function gaussianRandom() {
  // Box-Muller transform for a roughly normal random variable
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function initState() {
  for (const s of UNIVERSE) {
    state.set(s.symbol, {
      symbol: s.symbol,
      name: s.name,
      price: s.basePrice,
      volume: s.baseVolume,
      dailyVolPct: s.dailyVolPct,
      history: Array.from({ length: 30 }, () => s.basePrice), // rolling price history for volatility calc
      volumeHistory: Array.from({ length: 30 }, () => s.baseVolume),
      high52w: s.basePrice * (1 + (0.15 + Math.random() * 0.15)),
      low52w: s.basePrice * (1 - (0.15 + Math.random() * 0.15)),
      lastUpdated: new Date(),
    });
  }
}

function tick() {
  for (const [symbol, s] of state) {
    // Random-walk price move scaled by the stock's own typical daily volatility
    const pctMove = (gaussianRandom() * s.dailyVolPct) / 100;
    s.price = Math.max(1, s.price * (1 + pctMove));

    // Occasionally simulate a volume spike (10% chance) to make "unusual activity" demoable
    const spike = Math.random() < 0.1 ? 2 + Math.random() * 3 : 1;
    const volumeNoise = 0.85 + Math.random() * 0.3;
    s.volume = Math.round(s.volume * 0.6 + (s.volume * volumeNoise * spike) * 0.4);

    s.history.push(s.price);
    if (s.history.length > 60) s.history.shift();
    s.volumeHistory.push(s.volume);
    if (s.volumeHistory.length > 60) s.volumeHistory.shift();

    if (s.price > s.high52w) s.high52w = s.price;
    if (s.price < s.low52w) s.low52w = s.price;

    s.lastUpdated = new Date();
  }
}

function getSnapshot(symbol) {
  const s = state.get(symbol);
  if (!s) return null;
  return {
    symbol: s.symbol,
    name: s.name,
    price: Number(s.price.toFixed(2)),
    volume: s.volume,
    high52w: Number(s.high52w.toFixed(2)),
    low52w: Number(s.low52w.toFixed(2)),
    history: s.history.map((p) => Number(p.toFixed(2))),
    volumeHistory: [...s.volumeHistory],
    lastUpdated: s.lastUpdated,
  };
}

function getAllSnapshots() {
  return Array.from(state.keys()).map((symbol) => getSnapshot(symbol));
}

function listUniverse() {
  return UNIVERSE.map(({ symbol, name }) => ({ symbol, name }));
}

function startEngine(intervalMs = 4000) {
  initState();
  tick(); // seed one tick immediately so data isn't flat on first load
  const handle = setInterval(tick, intervalMs);
  return handle;
}

module.exports = { startEngine, getSnapshot, getAllSnapshots, listUniverse };
