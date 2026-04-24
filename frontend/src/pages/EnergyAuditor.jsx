import { useState, useEffect } from 'react';
import api from '../services/api';
import { Zap, Trash2, Plus, Loader2, Eye, Leaf, DollarSign, TrendingDown, X } from 'lucide-react';
import toast from 'react-hot-toast';

const climateZones = [
  { value: 'hot-humid', label: 'Hot & Humid' },
  { value: 'hot-dry', label: 'Hot & Dry' },
  { value: 'mixed-humid', label: 'Mixed Humid' },
  { value: 'mixed-dry', label: 'Mixed Dry' },
  { value: 'cold', label: 'Cold' },
  { value: 'very-cold', label: 'Very Cold' },
  { value: 'temperate', label: 'Temperate' },
  { value: 'marine', label: 'Marine' },
];

export default function EnergyAuditor() {
  const [audits, setAudits] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [formData, setFormData] = useState({ floor_plan_id: '', climate_zone: 'temperate' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const fpRes = await api.getFloorPlans();
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      setAudits([]);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!formData.floor_plan_id) { toast.error('Please select a floor plan'); return; }
    setAnalyzing(true);
    try {
      const response = await api.aiEnergyAudit(formData);
      if (response.data.success !== false) {
        toast.success('Energy audit completed!');
        setShowModal(false);
        setFormData({ floor_plan_id: '', climate_zone: 'temperate' });
        fetchData();
      } else { toast.error(response.data.error || 'Failed'); }
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to complete audit'); }
    finally { setAnalyzing(false); }
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Energy Efficiency Auditor</h1>
          <p className="text-gray-500 mt-1">Analyze energy consumption and find savings opportunities</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Audit
        </button>
      </div>

      {audits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Energy Audits Yet</h3>
          <p className="text-gray-500 mb-4">Discover ways to reduce energy costs and carbon footprint</p>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Audit</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audits.map((item) => (
            <div key={item.id} onClick={() => setShowDetail(item)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Zap className="h-6 w-6 text-green-600" /></div>
                <div className={`px-3 py-1 text-lg font-bold rounded-lg ${getScoreColor(item.efficiency_score)}`}>{getScoreGrade(item.efficiency_score)}</div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.floor_plan_name}</h3>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Efficiency Score</span>
                  <span className="font-semibold">{item.efficiency_score?.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.efficiency_score >= 70 ? 'bg-green-500' : item.efficiency_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${item.efficiency_score || 0}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-500">Annual Cost</p>
                  <p className="font-semibold text-red-600">{formatCurrency(item.annual_cost_estimate)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-500">Potential Savings</p>
                  <p className="font-semibold text-green-600">{formatCurrency(item.potential_savings)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-500"><Leaf className="h-4 w-4" /><span>{item.carbon_footprint?.toFixed(1)} tons CO2</span></div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowDetail(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => setShowConfirm(item)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">New Energy Audit</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan *</label>
                <select value={formData.floor_plan_id} onChange={(e) => setFormData({ ...formData, floor_plan_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a floor plan...</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Climate Zone</label>
                <select value={formData.climate_zone} onChange={(e) => setFormData({ ...formData, climate_zone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {climateZones.map(zone => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
                </select>
                <p className="text-sm text-gray-500 mt-1">Helps provide accurate energy estimates</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAnalyze} disabled={analyzing || !formData.floor_plan_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />} {analyzing ? 'Auditing...' : 'Run Audit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Energy Audit Report</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                      <p className="text-sm text-green-600">Energy Efficiency Report</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getScoreColor(showDetail.efficiency_score)}`}>{getScoreGrade(showDetail.efficiency_score)}</div>
                    <p className="text-sm text-gray-500 mt-1">{showDetail.efficiency_score?.toFixed(1)}/100</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{formatCurrency(showDetail.annual_cost_estimate)}</p>
                  <p className="text-xs text-gray-500">Annual Cost</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <TrendingDown className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">{formatCurrency(showDetail.potential_savings)}</p>
                  <p className="text-xs text-gray-500">Potential Savings</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Leaf className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{showDetail.carbon_footprint?.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Tons CO2/yr</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(showDetail.annual_cost_estimate / 12)}</p>
                  <p className="text-xs text-gray-500">Monthly</p>
                </div>
              </div>
              {showDetail.full_result && (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none whitespace-pre-wrap">{showDetail.full_result}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Audit</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this energy audit?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
