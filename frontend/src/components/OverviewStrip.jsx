export default function OverviewStrip({ watchlist, narrated }) {
  const scored = watchlist.filter((i) => i.attention);
  const gainers = scored.filter((i) => (i.attention.priceDeltaPct || 0) > 0).length;
  const losers = scored.filter((i) => (i.attention.priceDeltaPct || 0) < 0).length;
  const avgDelta =
    scored.length > 0
      ? scored.reduce((sum, i) => sum + (i.attention.priceDeltaPct || 0), 0) / scored.length
      : 0;
  const needsAttention = scored.filter((i) => i.attention.score >= 30).length;

  if (watchlist.length === 0) return null;

  return (
    <>
      <div className="overview-strip">
        <div className="overview-stat">
          <span className={`value ${avgDelta >= 0 ? "positive" : "negative"}`}>
            {avgDelta >= 0 ? "+" : ""}
            {avgDelta.toFixed(2)}%
          </span>
          <span className="label">Avg. change since last visit</span>
        </div>
        <div className="overview-stat">
          <span className="value">{gainers} / {losers}</span>
          <span className="label">Gainers / losers</span>
        </div>
        <div className="overview-stat">
          <span className="value" style={{ color: needsAttention > 0 ? "#f2a93b" : undefined }}>
            {needsAttention}
          </span>
          <span className="label">Need your attention</span>
        </div>
      </div>
      {narrated && <p className="narrated-line">{narrated}</p>}
    </>
  );
}