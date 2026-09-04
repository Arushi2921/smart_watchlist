import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function StableRow({ item, onRemove }) {
  const { live, attention } = item;
  const priceUp = (attention?.priceDeltaPct || 0) >= 0;
  const sparkData = live.sparkline.map((price, i) => ({ i, price }));

  return (
    <div className="stable-row">
      <span className="symbol">{item.symbol}</span>
      <span className="name">{item.name}</span>
      <span className="price">₹{live.price.toLocaleString("en-IN")}</span>
      <span className={priceUp ? "delta-up" : "delta-down"}>
        {attention?.priceDeltaPct !== undefined
          ? `${priceUp ? "▲" : "▼"} ${Math.abs(attention.priceDeltaPct)}%`
          : "—"}
      </span>
      <span className="sparkline-cell">
        <ResponsiveContainer width={60} height={22}>
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="price" stroke="#8592aa" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </span>
      <button className="remove-link" onClick={() => onRemove(item.symbol)}>
        Remove
      </button>
    </div>
  );
}