const PURPLE = '#5d45fd';

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// simple bar chart for tasks done this week
// `counts` is an array with 5 numbers: Monday–Friday.
export default function WeekActivityChart({ counts }) {
  const maxCount = Math.max(8, ...counts, 1);
  const maxBarHeight = 120;

  return (
    <div className="week-activity-chart">
      <div
        className="d-flex align-items-end justify-content-between gap-2"
        style={{ height: maxBarHeight + 24 }}
      >
        {LABELS.map((label, index) => {
          const value = counts[index] ?? 0;
          const barHeight = (value / maxCount) * maxBarHeight;

          return (
            <div key={label} className="flex-fill d-flex flex-column align-items-center gap-1">
              <div
                className="w-100 rounded-2"
                style={{
                  height: Math.max(barHeight, value > 0 ? 4 : 0),
                  maxHeight: maxBarHeight,
                  background: PURPLE,
                  minHeight: value === 0 ? 0 : undefined,
                }}
                title={`${value} tasks`}
              />
              <span className="text-muted small">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.7rem' }}>
        <span>0</span>
        <span>{maxCount}</span>
      </div>
    </div>
  );
}
