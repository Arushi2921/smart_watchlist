import { useState } from "react";

const INTENT_OPTIONS = [
  { value: "long_term", label: "Long-term hold" },
  { value: "swing_trade", label: "Swing trade" },
  { value: "watching_dip", label: "Waiting for a dip" },
  { value: "just_curious", label: "Just curious" },
];

export default function AddStockForm({ universe, existingSymbols, onAdd }) {
  const [symbol, setSymbol] = useState("");
  const [intent, setIntent] = useState("just_curious");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const available = universe.filter((s) => !existingSymbols.includes(s.symbol));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!symbol) {
      setError("Pick a stock first");
      return;
    }
    try {
      await onAdd(symbol, intent, note);
      setSymbol("");
      setNote("");
      setIntent("just_curious");
    } catch (err) {
      setError(err?.response?.data?.error || "Could not add stock");
    }
  }

  return (
    <form className="add-stock-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          <option value="">+ Add a stock…</option>
          {available.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} — {s.name}
            </option>
          ))}
        </select>

        <select value={intent} onChange={(e) => setIntent(e.target.value)}>
          {INTENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Why are you watching this? (optional, e.g. 'waiting for it to dip below 2800')"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button type="submit">Add to watchlist</button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
