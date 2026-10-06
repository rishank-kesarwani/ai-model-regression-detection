'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
  height?: number;
}

export function SimpleChart({
  title,
  data,
  color = '#6366f1',
  unit = '',
  height = 140,
}: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center justify-center text-xs text-slate-500" style={{ height }}>
        No trend data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;

  const width = 400;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
    const y = height - padding - ((d.value - min) / range) * graphHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  const latest = data[data.length - 1];

  return (
    <div className="glass-card rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase text-slate-400">{title}</span>
        <div className="text-xs font-mono font-bold text-white">
          {latest.value.toLocaleString(undefined, { maximumFractionDigits: 3 })} {unit}
        </div>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon points={areaPoints} fill={`url(#grad-${title})`} />

          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data dots */}
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
            const y = height - padding - ((d.value - min) / range) * graphHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill="#0f172a"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
