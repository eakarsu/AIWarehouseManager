import React, { useEffect, useMemo, useState } from 'react';

// SVG grid of warehouse aisles/bins colored by fill % or pick frequency.
export default function WarehouseFloorMap() {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('fillPct'); // 'fillPct' | 'pickFreq'
  const [hover, setHover] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/floor-heatmap', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const vals = data.cells.map((c) => c[mode]);
    const max = Math.max(...vals, 1);
    return { max };
  }, [data, mode]);

  function colorFor(value) {
    if (!stats) return '#e5e7eb';
    const ratio = Math.min(1, value / stats.max);
    if (mode === 'fillPct') {
      // blue scale
      if (ratio < 0.25) return '#dbeafe';
      if (ratio < 0.5) return '#93c5fd';
      if (ratio < 0.75) return '#3b82f6';
      return '#1d4ed8';
    }
    // pick frequency: green -> orange -> red
    if (ratio < 0.25) return '#dcfce7';
    if (ratio < 0.5) return '#fde68a';
    if (ratio < 0.75) return '#fb923c';
    return '#dc2626';
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700">
        Floor heatmap failed to load: {error}
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-gray-500">Loading floor heatmap...</div>;
  }

  const cellW = 56;
  const cellH = 40;
  const padX = 60;
  const padY = 40;
  const svgW = padX + data.cols * cellW + 20;
  const svgH = padY + data.rows * cellH + 40;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Warehouse Floor Heatmap</h2>
          <p className="text-sm text-gray-500">
            {data.rows} aisles × {data.cols} bins ({data.cells.length} locations)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('fillPct')}
            className={`px-3 py-1.5 text-sm rounded ${
              mode === 'fillPct'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fill %
          </button>
          <button
            onClick={() => setMode('pickFreq')}
            className={`px-3 py-1.5 text-sm rounded ${
              mode === 'pickFreq'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pick Frequency
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <svg width={svgW} height={svgH} className="block">
          {/* Column headers */}
          {Array.from({ length: data.cols }).map((_, c) => (
            <text
              key={`col-${c}`}
              x={padX + c * cellW + cellW / 2}
              y={padY - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {String(c + 1).padStart(2, '0')}
            </text>
          ))}
          {/* Row headers */}
          {data.aisles.map((a, r) => (
            <text
              key={`row-${r}`}
              x={padX - 18}
              y={padY + r * cellH + cellH / 2 + 4}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#374151"
            >
              {a}
            </text>
          ))}
          {/* Cells */}
          {data.cells.map((cell) => {
            const x = padX + cell.col * cellW;
            const y = padY + cell.row * cellH;
            return (
              <g
                key={cell.id}
                onMouseEnter={() => setHover(cell)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={cellW - 4}
                  height={cellH - 4}
                  rx={4}
                  fill={colorFor(cell[mode])}
                  stroke={hover && hover.id === cell.id ? '#111827' : '#ffffff'}
                  strokeWidth={hover && hover.id === cell.id ? 2 : 1}
                />
                <text
                  x={x + cellW / 2}
                  y={y + cellH / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={cell[mode] > stats.max * 0.5 ? '#ffffff' : '#1f2937'}
                  fontWeight="600"
                >
                  {mode === 'fillPct' ? `${cell.fillPct}%` : cell.pickFreq}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-semibold uppercase tracking-wide">Legend:</span>
        {[0.1, 0.4, 0.6, 0.9].map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-4 rounded"
              style={{ background: colorFor(r * (stats?.max || 1)) }}
            />
            <span>{mode === 'fillPct' ? `${Math.round(r * 100)}%` : Math.round(r * (stats?.max || 1))}</span>
          </div>
        ))}
      </div>

      {/* Hover detail */}
      <div className="mt-3 min-h-[48px]">
        {hover ? (
          <div className="text-sm bg-gray-50 border border-gray-200 rounded p-3 flex flex-wrap gap-x-6 gap-y-1">
            <span><strong>Bin:</strong> {hover.id}</span>
            <span><strong>SKU:</strong> {hover.sku}</span>
            <span><strong>Category:</strong> {hover.category}</span>
            <span><strong>Fill:</strong> {hover.fillPct}%</span>
            <span><strong>Picks/day:</strong> {hover.pickFreq}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400">Hover a bin to see SKU details.</div>
        )}
      </div>
    </div>
  );
}
