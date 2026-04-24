import { useState, useEffect } from 'react';
import api from '../services/api';
import { Wrench, Trash2, Plus, Loader2, Eye, Calendar, AlertTriangle, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MaintenancePredictor() {
  const [predictions, setPredictions] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [formData, setFormData] = useState({ floor_plan_id: '', home_age: 10 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const fpRes = await api.getFloorPlans();
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      setPredictions([]);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!formData.floor_plan_id) { toast.error('Please select a floor plan'); return; }
    setAnalyzing(true);
    try {
      const response = await api.aiMaintenancePrediction(formData);
      if (response.data.success !== false) {
        toast.success('Maintenance prediction generated!');
        setShowModal(false);
        setFormData({ floor_plan_id: '', home_age: 10 });
        fetchData();
      } else { toast.error(response.data.error || 'Failed'); }
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to generate prediction'); }
    finally { setAnalyzing(false); }
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
  const formatDate = (dateStr) => { if (!dateStr) return 'Not scheduled'; return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Home Maintenance Predictor</h1>
          <p className="text-gray-500 mt-1">Predict and plan home maintenance needs before problems arise</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Prediction
        </button>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Maintenance Predictions Yet</h3>
          <p className="text-gray-500 mb-4">Get AI-powered maintenance schedules and cost predictions</p>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Prediction</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((item) => (
            <div key={item.id} onClick={() => setShowDetail(item)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Wrench className="h-6 w-6 text-blue-600" /></div>
                {item.priority_items > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> {item.priority_items} priority
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.floor_plan_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Calendar className="h-4 w-4" /><span>Next: {formatDate(item.next_maintenance_date)}</span></div>
              <div className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-3"><DollarSign className="h-5 w-5" /><span>{formatCurrency(item.total_annual_cost)}/year</span></div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
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
              <h2 className="text-xl font-semibold">Create Maintenance Prediction</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Home Age (years)</label>
                <input type="number" min="0" max="100" value={formData.home_age}
                  onChange={(e) => setFormData({ ...formData, home_age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <p className="text-sm text-gray-500 mt-1">Approximate age of the property</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAnalyze} disabled={analyzing || !formData.floor_plan_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />} {analyzing ? 'Analyzing...' : 'Generate Prediction'}
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
              <h2 className="text-xl font-semibold">Maintenance Prediction</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                      <p className="text-sm text-blue-600">Annual Maintenance Plan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(showDetail.total_annual_cost)}</p>
                    <p className="text-sm text-gray-500">per year</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{showDetail.priority_items}</p>
                  <p className="text-sm text-gray-500">Priority Items</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{formatDate(showDetail.next_maintenance_date)}</p>
                  <p className="text-sm text-gray-500">Next Due</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{formatCurrency(showDetail.total_annual_cost / 12)}</p>
                  <p className="text-sm text-gray-500">Monthly</p>
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
            <h2 className="text-lg font-semibold mb-2">Delete Prediction</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this maintenance prediction?</p>
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
