export default function SummaryBanner({ summary }) {
  if (!summary) return null;
  return (
    <div className="summary-banner">
      <span className="summary-icon">📊</span>
      <p>{summary}</p>
    </div>
  );
}
