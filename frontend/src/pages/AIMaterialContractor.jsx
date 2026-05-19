import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle, Wrench, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

// Apply pass 4 — surfaces the new mechanical backlog endpoints:
//   POST /api/ai/material-wear-prediction
//   POST /api/ai/contractor-match
// Auth: JWT bearer via the shared axios interceptor (localStorage 'token').

const TABS = [
  { id: 'material-wear', label: 'Material Wear', icon: Wrench },
  { id: 'contractor-match', label: 'Contractor Match', icon: Users },
];

export default function AIMaterialContractor() {
  const [tab, setTab] = useState('material-wear');

  const [wearForm, setWearForm] = useState({
    materials: '',
    environment: '',
    usage_intensity: 'normal',
    climate: 'temperate',
    notes: '',
  });
  const [wearLoading, setWearLoading] = useState(false);
  const [wearError, setWearError] = useState('');
  const [wearResult, setWearResult] = useState(null);

  const [matchForm, setMatchForm] = useState({
    job_description: '',
    required_skills: '',
    budget: '',
    timeline: '',
    location: '',
  });
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [matchResult, setMatchResult] = useState(null);

  const handle503OrError = (err, setError) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.message || 'Request failed';
    if (status === 503) {
      setError('AI not configured: OPENROUTER_API_KEY is missing on the server.');
      toast.error('AI not configured (503).');
    } else {
      setError(msg);
      toast.error(msg);
    }
  };

  const submitWear = async (e) => {
    e.preventDefault();
    if (!wearForm.materials.trim()) {
      toast.error('Please enter at least one material.');
      return;
    }
    setWearLoading(true);
    setWearError('');
    setWearResult(null);
    try {
      const payload = {
        materials: wearForm.materials,
        environment: wearForm.environment || undefined,
        usage_intensity: wearForm.usage_intensity || undefined,
        climate: wearForm.climate || undefined,
        notes: wearForm.notes || undefined,
      };
      const res = await api.predictMaterialWear(payload);
      setWearResult(res.data);
      toast.success('Material wear prediction generated.');
    } catch (err) {
      handle503OrError(err, setWearError);
    } finally {
      setWearLoading(false);
    }
  };

  const submitMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.job_description.trim() || matchForm.job_description.trim().length < 5) {
      toast.error('Please enter a job description (min 5 chars).');
      return;
    }
    setMatchLoading(true);
    setMatchError('');
    setMatchResult(null);
    try {
      const payload = {
        job_description: matchForm.job_description,
        required_skills: matchForm.required_skills || undefined,
        budget: matchForm.budget || undefined,
        timeline: matchForm.timeline || undefined,
        location: matchForm.location || undefined,
      };
      const res = await api.matchContractor(payload);
      setMatchResult(res.data);
      toast.success('Contractor matches ranked.');
    } catch (err) {
      handle503OrError(err, setMatchError);
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">AI Materials & Contractors</h1>
        <p className="text-gray-500 mt-1">
          Predict material wear and rank contractors against a job description.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'material-wear' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <form onSubmit={submitWear} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materials (comma-separated) *
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={wearForm.materials}
                onChange={(e) => setWearForm({ ...wearForm, materials: e.target.value })}
                placeholder="Oak hardwood floor, quartz countertop, MDF cabinets"
                disabled={wearLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={wearForm.environment}
                  onChange={(e) => setWearForm({ ...wearForm, environment: e.target.value })}
                  placeholder="kitchen / bathroom / outdoor patio"
                  disabled={wearLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Intensity</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={wearForm.usage_intensity}
                  onChange={(e) => setWearForm({ ...wearForm, usage_intensity: e.target.value })}
                  disabled={wearLoading}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="heavy">Heavy</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Climate</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={wearForm.climate}
                  onChange={(e) => setWearForm({ ...wearForm, climate: e.target.value })}
                  disabled={wearLoading}
                >
                  <option value="temperate">Temperate</option>
                  <option value="humid">Humid</option>
                  <option value="arid">Arid</option>
                  <option value="cold">Cold</option>
                  <option value="coastal">Coastal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={wearForm.notes}
                  onChange={(e) => setWearForm({ ...wearForm, notes: e.target.value })}
                  placeholder="e.g. pets, sun exposure"
                  disabled={wearLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={wearLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {wearLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {wearLoading ? 'Analyzing...' : 'Predict Material Wear'}
            </button>
          </form>

          {wearError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{wearError}</span>
            </div>
          )}

          {wearResult && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Result</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(wearResult.result || wearResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {tab === 'contractor-match' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <form onSubmit={submitMatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={matchForm.job_description}
                onChange={(e) => setMatchForm({ ...matchForm, job_description: e.target.value })}
                placeholder="Renovate a 200 sqft kitchen, replace cabinets and countertops, install pendant lighting..."
                disabled={matchLoading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={matchForm.required_skills}
                  onChange={(e) => setMatchForm({ ...matchForm, required_skills: e.target.value })}
                  placeholder="cabinetry, electrical, tile"
                  disabled={matchLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={matchForm.budget}
                  onChange={(e) => setMatchForm({ ...matchForm, budget: e.target.value })}
                  placeholder="$15,000 - $25,000"
                  disabled={matchLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={matchForm.timeline}
                  onChange={(e) => setMatchForm({ ...matchForm, timeline: e.target.value })}
                  placeholder="4-6 weeks"
                  disabled={matchLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={matchForm.location}
                  onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value })}
                  placeholder="Brooklyn, NY"
                  disabled={matchLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={matchLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {matchLoading ? 'Matching...' : 'Rank Contractors'}
            </button>
          </form>

          {matchError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{matchError}</span>
            </div>
          )}

          {matchResult && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Result</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(matchResult.result || matchResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
