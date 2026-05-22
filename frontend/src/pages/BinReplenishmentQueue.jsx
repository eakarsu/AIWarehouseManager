import React, { useEffect, useState } from 'react';

const emptyForm = { zone: '', bin: '', sku: '', onHand: 0, min: 0, replenishmentQty: 0, status: 'watch' };

export default function BinReplenishmentQueue() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, urgent: 0, replenishmentQty: 0 });
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const res = await fetch('/api/bin-replenishment-queue', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    const data = await res.json();
    setRows(data.rows || []);
    setSummary(data.summary || { total: 0, urgent: 0, replenishmentQty: 0 });
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await fetch('/api/bin-replenishment-queue', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(form) });
    setForm(emptyForm);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bin Replenishment Queue</h1>
      <div className="grid grid-cols-3 gap-4">{['total', 'urgent', 'replenishmentQty'].map(k => <div key={k} className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">{k}</div><div className="text-2xl font-semibold">{summary[k]}</div></div>)}</div>
      <form onSubmit={submit} className="grid gap-3 bg-white rounded-lg shadow p-4 md:grid-cols-4">
        {['zone', 'bin', 'sku'].map(f => <input key={f} className="border rounded p-2" placeholder={f} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}
        {['onHand', 'min', 'replenishmentQty'].map(f => <input key={f} className="border rounded p-2" type="number" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}
        <select className="border rounded p-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>watch</option><option>urgent</option><option>clear</option></select>
        <button className="bg-indigo-600 text-white rounded px-4 py-2">Add Bin</button>
      </form>
      <table className="w-full bg-white rounded-lg shadow overflow-hidden"><thead><tr>{['Zone','Bin','SKU','On Hand','Min','Replenish','Status'].map(h => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t"><td className="p-3">{r.zone}</td><td>{r.bin}</td><td>{r.sku}</td><td>{r.onHand}</td><td>{r.min}</td><td>{r.replenishmentQty}</td><td>{r.status}</td></tr>)}</tbody></table>
    </div>
  );
}
