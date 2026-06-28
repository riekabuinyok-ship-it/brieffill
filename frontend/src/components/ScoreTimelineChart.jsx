import { useState } from "react";

export default function ScoreTimelineChart({ points = [] }) {
  const [hover, setHover] = useState(null);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
        <span className="material-symbols-outlined text-4xl text-outline-variant">trending_up</span>
        <p className="mt-2 text-sm text-on-surface-variant">Analyze more briefs to see your score over time.</p>
      </div>
    );
  }

  if (points.length === 1) {
    const p = points[0];
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Your progress</p>
            <p className="mt-1 text-sm text-on-surface">
              {p.clientName} <span className="text-on-surface-variant">—</span> {p.projectName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-display text-primary">{p.score}%</p>
            <p className="text-xs text-on-surface-variant">{new Date(p.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  const width = 480;
  const height = 140;
  const padding = { top: 10, right: 12, bottom: 22, left: 28 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scores = points.map((p) => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const yScale = (score) => padding.top + innerHeight - ((score - minScore) / (maxScore - minScore || 1)) * innerHeight;
  const xScale = (i) => padding.left + (i / (points.length - 1)) * innerWidth;

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.score).toFixed(1)}`)
    .join(" ");
  const areaData = `${pathData} L ${xScale(points.length - 1).toFixed(1)} ${padding.top + innerHeight} L ${xScale(0).toFixed(1)} ${padding.top + innerHeight} Z`;

  const yTicks = [0, 25, 50, 75, 100].filter((t) => t >= minScore && t <= maxScore);

  const firstScore = points[0].score;
  const lastScore = points[points.length - 1].score;
  const trend = lastScore - firstScore;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-stack-sm">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Score over time</p>
          <p className="text-sm text-on-surface-variant">Last {points.length} brief{points.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`text-sm font-semibold ${trend > 0 ? "text-primary" : trend < 0 ? "text-error" : "text-on-surface-variant"}`}>
          {trend > 0 ? "+" : ""}{trend} pts
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Score over time">
        <defs>
          <linearGradient id="bf-timeline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={padding.left + innerWidth}
              y2={yScale(tick)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text x={padding.left - 6} y={yScale(tick) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
              {tick}
            </text>
          </g>
        ))}
        <path d={areaData} fill="url(#bf-timeline-fill)" />
        <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(p.score)}
              r={hover === i ? 5 : 3.5}
              fill="#2563eb"
              stroke="white"
              strokeWidth="1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            />
            <text
              x={xScale(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="8"
              fill={hover === i ? "#111c2d" : "#9ca3af"}
              fontWeight={hover === i ? 600 : 400}
            >
              {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
          </g>
        ))}
      </svg>
      {hover !== null && points[hover] && (
        <div className="mt-stack-sm rounded-lg border border-primary/20 bg-primary-container/5 p-stack-sm text-sm">
          <p className="font-semibold text-on-surface">{points[hover].clientName} — {points[hover].projectName}</p>
          <p className="text-on-surface-variant">
            <span className="font-bold text-primary">{points[hover].score}%</span> · {new Date(points[hover].createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
