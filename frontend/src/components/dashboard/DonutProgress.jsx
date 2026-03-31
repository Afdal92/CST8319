const PURPLE = '#5d45fd';
const TRACK = '#e2e8f0';

// donut-style progress chart for tasks
// `percent` is 0–100, `completed` and `remaining` are task counts.
export default function DonutProgress({ percent, completed, remaining }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const safePercent = Math.min(100, Math.max(0, percent));
  const dashLength = (safePercent / 100) * circumference;

  return (
    <div className="donut-progress text-center">
      <svg width="160" height="160" viewBox="0 0 120 120" className="mx-auto d-block">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={TRACK} strokeWidth="14" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={PURPLE}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference}`}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="donut-progress__pct"
          fill="#0f172a"
          fontSize="18"
          fontWeight="700"
        >
          {Math.round(safePercent)}%
        </text>
        <text x="60" y="74" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
          Done
        </text>
      </svg>
      <div className="d-flex justify-content-center gap-4 mt-2 small">
        <span className="d-flex align-items-center gap-2 text-secondary">
          <span className="rounded-circle" style={{ width: 8, height: 8, background: PURPLE }} />
          Completed <strong className="text-dark ms-1">{completed}</strong>
        </span>
        <span className="d-flex align-items-center gap-2 text-secondary">
          <span className="rounded-circle" style={{ width: 8, height: 8, background: TRACK }} />
          To Do / In Progress <strong className="text-dark ms-1">{remaining}</strong>
        </span>
      </div>
    </div>
  );
}
