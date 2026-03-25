const PURPLE = '#5d45fd';

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Bars reflect Task rows completed this week: status DONE, grouped by `updatedAt` weekday (local).
 * @param {{ counts: number[] }} props — length 5, Mon–Fri
 */
export default function WeekActivityChart({ counts }) {
  const max = Math.max(8, ...counts, 1);
  const h = 120;

  return (
    <div className="week-activity-chart">
      <div className="d-flex align-items-end justify-content-between gap-2" style={{ height: h + 24 }}>
        {LABELS.map((label, i) => {
          const v = counts[i] ?? 0;
          const barH = (v / max) * h;
          return (
            <div key={label} className="flex-fill d-flex flex-column align-items-center gap-1">
              <div
                className="w-100 rounded-2"
                style={{
                  height: Math.max(barH, v > 0 ? 4 : 0),
                  maxHeight: h,
                  background: PURPLE,
                  minHeight: v === 0 ? 0 : undefined,
                }}
                title={`${v} tasks`}
              />
              <span className="text-muted small">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.7rem' }}>
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
