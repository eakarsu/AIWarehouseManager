import React, { useMemo, useRef, useState } from 'react';

// InventoryAdjustWizard — multi-step bulk adjustment flow:
//   1. choose location
//   2. upload CSV or paste rows
//   3. preview deltas
//   4. confirm -> POST /api/custom-views/inventory-adjust
const LOCATIONS = [
  { id: 'WH-NORTH', label: 'North DC' },
  { id: 'WH-EAST',  label: 'East Spoke' },
  { id: 'WH-WEST',  label: 'West Spoke' },
  { id: 'WH-SOUTH', label: 'South DC' },
];

const STEPS = ['Location', 'Input', 'Preview', 'Confirm'];

function parseCsvText(text) {
  if (!text) return { rows: [], parseErrors: [] };
  const rows = [];
  const parseErrors = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let startIdx = 0;
  if (lines.length > 0 && /sku/i.test(lines[0]) && /delta|qty|change/i.test(lines[0])) {
    startIdx = 1; // skip header
  }
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim());
    if (parts.length < 2) {
      parseErrors.push({ line: i + 1, message: `expected at least sku,delta — got "${lines[i]}"` });
      continue;
    }
    const [sku, deltaStr, ...rest] = parts;
    const delta = Number(deltaStr);
    if (!Number.isFinite(delta)) {
      parseErrors.push({ line: i + 1, message: `delta "${deltaStr}" is not a number` });
      continue;
    }
    rows.push({ sku, delta, note: rest.join(', ') || '' });
  }
  return { rows, parseErrors };
}

export default function InventoryAdjustWizard() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState(LOCATIONS[0].id);
  const [csvText, setCsvText] = useState(
    'sku,delta,note\nSKU-A1001,5,restock\nSKU-B1003,-2,damaged\nSKU-C1007,12,cycle count\n'
  );
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const fileInputRef = useRef(null);

  const { rows, parseErrors } = useMemo(() => parseCsvText(csvText), [csvText]);
  const netUnits = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.delta) || 0), 0),
    [rows]
  );

  function onFileChosen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(String(ev.target.result || ''));
    reader.readAsText(file);
  }

  function reset() {
    setStep(0);
    setResult(null);
    setSubmitError(null);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/inventory-adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ location, rows }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? ` — ${text.slice(0, 120)}` : ''}`);
      }
      const json = await res.json();
      setResult(json);
      setStep(3);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance =
    (step === 0 && !!location) ||
    (step === 1 && rows.length > 0) ||
    (step === 2 && rows.length > 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Inventory Adjustment Wizard
          </h2>
          <p className="text-sm text-gray-500">
            Apply many SKU deltas at once across a chosen warehouse location.
          </p>
        </div>
        <span className="inline-block px-2 py-1 text-xs rounded bg-purple-50 text-purple-700 border border-purple-200">
          Multi-step
        </span>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-green-600 text-white'
                  : i === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm ${
                i === step ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="w-6 h-px bg-gray-300 mx-1" />
            )}
          </li>
        ))}
      </ol>

      {/* Step content */}
      {step === 0 && (
        <div>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Location
            </span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full md:w-80 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} ({l.id})
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            All deltas in this batch will be attributed to this location.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={onFileChosen}
              className="hidden"
            />
            {fileName && (
              <span className="text-xs text-gray-500">Loaded: {fileName}</span>
            )}
            <span className="text-xs text-gray-400">
              or paste rows below — format: <code>sku,delta,note</code>
            </span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={9}
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
          <div className="text-xs text-gray-600">
            Parsed <strong>{rows.length}</strong> rows
            {parseErrors.length > 0 && (
              <span className="text-red-600"> • {parseErrors.length} parse errors</span>
            )}
          </div>
          {parseErrors.length > 0 && (
            <ul className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 max-h-32 overflow-auto">
              {parseErrors.slice(0, 10).map((e, i) => (
                <li key={i}>line {e.line}: {e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-700">
              Location: <strong>{location}</strong> • Rows:{' '}
              <strong>{rows.length}</strong> • Net units:{' '}
              <strong className={netUnits >= 0 ? 'text-green-700' : 'text-red-700'}>
                {netUnits >= 0 ? `+${netUnits}` : netUnits}
              </strong>
            </div>
          </div>
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-600 uppercase">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2 text-right">Delta</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 font-mono text-xs">{r.sku}</td>
                    <td
                      className={`px-3 py-1.5 text-right font-semibold ${
                        r.delta >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {r.delta >= 0 ? `+${r.delta}` : r.delta}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 border-t border-gray-100">
                ...and {rows.length - 50} more rows.
              </div>
            )}
          </div>
          {submitError && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {submitError}
            </div>
          )}
        </div>
      )}

      {step === 3 && result && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="text-sm text-green-900 font-semibold mb-1">
              Adjustment applied
            </div>
            <div className="text-sm text-green-800">
              Applied <strong>{result.applied}</strong> of{' '}
              <strong>{result.summary && result.summary.totalRows}</strong> rows at{' '}
              <strong>{result.location}</strong>. Net units:{' '}
              <strong>{result.summary && result.summary.netUnits}</strong>.
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-red-700 mb-1">
                  {result.errors.length} errors:
                </div>
                <ul className="text-xs text-red-700 bg-white border border-red-200 rounded p-2 max-h-32 overflow-auto">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>
                      row {e.row}: {e.sku || ''} — {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Applied at: {result.appliedAt}
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => (step > 0 && step < 3 ? setStep(step - 1) : reset())}
          disabled={submitting}
          className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50"
        >
          {step === 3 ? 'Start Over' : step === 0 ? 'Reset' : 'Back'}
        </button>

        {step < 2 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance}
            className={`px-4 py-1.5 text-sm rounded ${
              canAdvance
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        )}
        {step === 2 && (
          <button
            onClick={submit}
            disabled={submitting || rows.length === 0}
            className={`px-4 py-1.5 text-sm rounded ${
              submitting || rows.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? 'Applying...' : `Confirm & Apply (${rows.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
