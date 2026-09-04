import { useEffect, useState, useCallback } from "react";
import { api } from "./api/client";
import OverviewStrip from "./components/OverviewStrip";
import AddStockForm from "./components/AddStockForm";
import WatchlistCard from "./components/WatchlistCard";
import StableRow from "./components/StableRow";
import "./App.css";

const POLL_MS = 5000;

export default function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [universe, setUniverse] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [wl, sum] = await Promise.all([api.getWatchlist(), api.getSummary()]);
      setWatchlist(wl);
      setSummary(sum.summary);
      setError("");
    } catch (err) {
      setError(
        err?.code === "ERR_NETWORK"
          ? "Can't reach the backend — make sure it's running on port 5000."
          : err?.response?.data?.error || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getUniverse().then(setUniverse).catch(() => {});
    refresh();
    const handle = setInterval(refresh, POLL_MS);
    return () => clearInterval(handle);
  }, [refresh]);

  async function handleAdd(symbol, intent, note) {
    await api.addStock(symbol, intent, note);
    await refresh();
  }

  async function handleRemove(symbol) {
    await api.removeStock(symbol);
    await refresh();
  }

  async function handleMarkSeen(symbol) {
    await api.markSeen(symbol);
    await refresh();
  }

  async function handleUpdateNote(symbol, intent, note) {
    await api.updateNote(symbol, intent, note);
    await refresh();
  }

  const needsAttention = watchlist
    .filter((i) => i.attention && i.attention.score >= 30)
    .sort((a, b) => b.attention.score - a.attention.score);
  const stable = watchlist
    .filter((i) => !i.attention || i.attention.score < 30)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <div className="app">
      <header>
        <h1>Smart Watchlist</h1>
        <p className="tagline">Not everything changed. Here's what actually did.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <OverviewStrip watchlist={watchlist} narrated={summary} />

      <AddStockForm
        universe={universe}
        existingSymbols={watchlist.map((i) => i.symbol)}
        onAdd={handleAdd}
      />

      {loading ? (
        <p className="loading">Loading your watchlist…</p>
      ) : watchlist.length === 0 ? (
        <p className="empty-state">Your watchlist is empty — add a stock above to get started.</p>
      ) : (
        <>
          {needsAttention.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>Needs your attention</h2>
                <span className="count">{needsAttention.length}</span>
              </div>
              <div className="attention-grid">
                {needsAttention.map((item) => (
                  <WatchlistCard
                    key={item.symbol}
                    item={item}
                    onRemove={handleRemove}
                    onMarkSeen={handleMarkSeen}
                    onUpdateNote={handleUpdateNote}
                  />
                ))}
              </div>
            </section>
          )}

          {stable.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>Stable — no major change</h2>
                <span className="count">{stable.length}</span>
              </div>
              <div className="stable-list">
                {stable.map((item) => (
                  <StableRow key={item.symbol} item={item} onRemove={handleRemove} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}