import { useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const LEVEL_COLORS = {
  high: "#e2586b",
  medium: "#f2a93b",
  calm: "#35c48c",
  new: "#8592aa",
};

const INTENT_LABELS = {
  long_term: "Long-term hold",
  swing_trade: "Swing trade",
  watching_dip: "Waiting for a dip",
  just_curious: "Just curious",
};

export default function WatchlistCard({ item, onRemove, onMarkSeen, onUpdateNote }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.note || "");

  const { attention, live } = item;
  const color = LEVEL_COLORS[attention.level] || LEVEL_COLORS.calm;
  const sparkData = live.sparkline.map((price, i) => ({ i, price }));
  const priceUp = (attention.priceDeltaPct || 0) >= 0;

  async function saveNote() {
    await onUpdateNote(item.symbol, item.intent, noteDraft);
    setEditingNote(false);
  }

  return (
    <div className="attention-card" style={{ "--level-color": color }}>
      <div className="card-top">
        <div>
          <h3>{item.symbol}</h3>
          <span className="stock-name">{item.name}</span>
        </div>
        <div className="score-ring">{attention.score}</div>
      </div>

      <div className="card-price-row">
        <span className="price">₹{live.price.toLocaleString("en-IN")}</span>
        {attention.priceDeltaPct !== undefined && (
          <span className={priceUp ? "delta-up" : "delta-down"}>
            {priceUp ? "▲" : "▼"} {Math.abs(attention.priceDeltaPct)}%
          </span>
        )}
        <div className="sparkline">
          <ResponsiveContainer width={80} height={30}>
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ul className="attention-reasons">
        {attention.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div className="card-meta">
        <span className="intent-tag">{INTENT_LABELS[item.intent]}</span>
        <span className="last-updated">
          Updated {new Date(live.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {editingNote ? (
        <div className="note-edit">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Why are you watching this?"
          />
          <button onClick={saveNote}>Save</button>
        </div>
      ) : (
        <p className="note-display" onClick={() => setEditingNote(true)}>
          {item.note ? item.note : "+ add a note on why you're watching this"}
        </p>
      )}

      <div className="card-actions">
        <button className="seen-btn" onClick={() => onMarkSeen(item.symbol)}>
          Mark as seen
        </button>
        <button className="remove-btn" onClick={() => onRemove(item.symbol)}>
          Remove
        </button>
      </div>
    </div>
  );
}