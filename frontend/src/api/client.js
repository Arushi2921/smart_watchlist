import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// This deviceId is our lightweight stand-in for a login system.
// It's generated once and stored in localStorage, so the SAME
// browser sees the same watchlist across sessions (the "return
// later and see what's changed" requirement) without needing
// real authentication.
function getDeviceId() {
  let id = localStorage.getItem("smart-watchlist-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("smart-watchlist-device-id", id);
  }
  return id;
}

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  config.headers["x-device-id"] = getDeviceId();
  return config;
});

export const api = {
  getUniverse: () => client.get("/watchlist/universe").then((r) => r.data),
  getWatchlist: () => client.get("/watchlist").then((r) => r.data),
  addStock: (symbol, intent, note) =>
    client.post("/watchlist", { symbol, intent, note }).then((r) => r.data),
  removeStock: (symbol) => client.delete(`/watchlist/${symbol}`).then((r) => r.data),
  markSeen: (symbol) => client.patch(`/watchlist/${symbol}/seen`).then((r) => r.data),
  updateNote: (symbol, intent, note) =>
    client.patch(`/watchlist/${symbol}`, { intent, note }).then((r) => r.data),
  getSummary: () => client.get("/summary").then((r) => r.data),
};

export { getDeviceId };
