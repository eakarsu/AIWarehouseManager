import React, { useState } from 'react';

// PickListExporter — pick a picker, name an order, hit "Generate Pick List"
// which POSTs to /api/custom-views/pick-list and downloads the returned PDF.
export default function PickListExporter() {
  const PICKERS = [
    { id: 'p1', name: 'Aiko Tanaka', shift: 'Morning' },
    { id: 'p2', name: 'Marcus Lee',  shift: 'Morning' },
    { id: 'p3', name: 'Priya Patel', shift: 'Afternoon' },
    { id: 'p4', name: 'Diego Ramos', shift: 'Afternoon' },
    { id: 'p5', name: 'Sara Klein',  shift: 'Night' },
  ];

  const [pickerId, setPickerId] = useState(PICKERS[0].id);
  const [orderNumber, setOrderNumber] = useState(
    `ORD-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const picker = PICKERS.find((p) => p.id === pickerId);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/pick-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderNumber,
          picker: picker ? `${picker.name} (${picker.shift})` : 'Unassigned',
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? ` — ${text.slice(0, 120)}` : ''}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pick-list-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus(`Pick list PDF generated for order ${orderNumber}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pick List Exporter</h2>
          <p className="text-sm text-gray-500">
            Generate a printable pick list PDF (items grouped by aisle).
          </p>
        </div>
        <span className="inline-block px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
          PDF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Order Number
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ORD-123456"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Order Picker
          </span>
          <select
            value={pickerId}
            onChange={(e) => setPickerId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PICKERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.shift} shift
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !orderNumber.trim()}
          className={`px-4 py-2 rounded text-sm font-medium ${
            loading || !orderNumber.trim()
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Pick List'}
        </button>
        {status && (
          <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
            {status}
          </span>
        )}
        {error && (
          <span className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
            {error}
          </span>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        The server synthesizes a sample SKU list and emits a multi-section PDF
        (one block per aisle) via pdfkit. Hand the printout to the picker on the floor.
      </div>
    </div>
  );
}
