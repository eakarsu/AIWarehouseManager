import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  Electronics: '#2563eb',
  Apparel: '#db2777',
  Grocery: '#16a34a',
  Hardware: '#f59e0b',
  Pharma: '#7c3aed',
};

// Recharts multi-line of turnover per SKU category over time.
export default function InventoryTurnover() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/inventory-turnover', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700">
        Turnover chart failed to load: {error}
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-gray-500">Loading inventory turnover...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Inventory Turnover by Category</h2>
        <p className="text-sm text-gray-500">{data.unit} — rolling 12 months</p>
      </div>

      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <LineChart data={data.series} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {data.categories.map((cat) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={COLORS[cat] || '#6b7280'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {data.categories.map((cat) => {
          const last = data.series[data.series.length - 1][cat];
          const first = data.series[0][cat];
          const delta = (((last - first) / first) * 100).toFixed(1);
          const up = Number(delta) >= 0;
          return (
            <div key={cat} className="rounded border border-gray-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {cat}
              </div>
              <div className="text-lg font-bold text-gray-900">{last}</div>
              <div className={`text-xs ${up ? 'text-green-600' : 'text-red-600'}`}>
                {up ? '+' : ''}
                {delta}% YoY
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
