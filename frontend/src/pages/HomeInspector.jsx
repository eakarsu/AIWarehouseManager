import { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardCheck, Trash2, Plus, Loader2, Eye, AlertTriangle, CheckCircle, DollarSign, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';

const inspectionTypes = [
  { value: 'general', label: 'General Inspection' },
  { value: 'pre-purchase', label: 'Pre-Purchase Inspection' },
  { value: 'pre-listing', label: 'Pre-Listing Inspection' },
  { value: 'new-construction', label: 'New Construction' },
  { value: 'historic', label: 'Historic Property' },
  { value: 'luxury', label: 'Luxury Property' },
  { value: 'commercial-to-residential', label: 'Commercial to Residential' },
  { value: 'green-certification', label: 'Green/Energy Certification' },
];

export default function HomeInspector() {
  const [inspections, setInspections] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [formData, setFormData] = useState({ floor_plan_id: '', inspection_type: 'general' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const fpRes = await api.getFloorPlans();
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      setInspections([]);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!formData.floor_plan_id) { toast.error('Please select a floor plan'); return; }
    setAnalyzing(true);
    try {
      const response = await api.aiHomeInspection(formData);
      if (response.data.success !== false) {
        toast.success('Home inspection completed!');
        setShowModal(false);
        setFormData({ floor_plan_id: '', inspection_type: 'general' });
        fetchData();
      } else { toast.error(response.data.error || 'Inspection failed'); }
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to complete inspection'); }
    finally { setAnalyzing(false); }
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

  const getConditionColor = (condition) => {
    const colors = { 'excellent': 'bg-green-100 text-green-700', 'good': 'bg-blue-100 text-blue-700', 'fair': 'bg-yellow-100 text-yellow-700', 'poor': 'bg-red-100 text-red-700' };
    return colors[condition?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getConditionIcon = (condition) => {
    if (condition?.toLowerCase() === 'excellent' || condition?.toLowerCase() === 'good') return <CheckCircle className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Home Inspection Reporter</h1>
          <p className="text-gray-500 mt-1">Generate comprehensive home inspection reports with AI</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Inspection
        </button>
      </div>

      {inspections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Home Inspections Yet</h3>
          <p className="text-gray-500 mb-4">Generate AI-powered home inspection reports</p>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Inspection</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspections.map((item) => (
            <div key={item.id} onClick={() => setShowDetail(item)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center"><ClipboardCheck className="h-6 w-6 text-indigo-600" /></div>
                <span className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getConditionColor(item.overall_condition)}`}>
                  {getConditionIcon(item.overall_condition)} {item.overall_condition}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.floor_plan_name}</h3>
              <p className="text-sm text-indigo-600 mb-3 capitalize">{item.inspection_type?.replace(/-/g, ' ')}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${item.critical_issues > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  <span>{item.critical_issues || 0} critical</span>
                </div>
                <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <span>{formatCurrency(item.estimated_repair_cost)}</span>
                </div>
              </div>
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
              <h2 className="text-xl font-semibold">New Home Inspection</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                <select value={formData.inspection_type} onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {inspectionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAnalyze} disabled={analyzing || !formData.floor_plan_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />} {analyzing ? 'Inspecting...' : 'Run Inspection'}
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
              <h2 className="text-xl font-semibold">Home Inspection Report</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                      <p className="text-sm text-indigo-600 capitalize">{showDetail.inspection_type?.replace(/-/g, ' ')} Inspection</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getConditionColor(showDetail.overall_condition)}`}>
                    {getConditionIcon(showDetail.overall_condition)}
                    <span className="font-semibold">{showDetail.overall_condition}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <AlertTriangle className={`h-6 w-6 mx-auto mb-1 ${showDetail.critical_issues > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  <p className="text-2xl font-bold text-red-600">{showDetail.critical_issues || 0}</p>
                  <p className="text-sm text-gray-500">Critical Issues</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(showDetail.estimated_repair_cost)}</p>
                  <p className="text-sm text-gray-500">Est. Repair Cost</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <ClipboardCheck className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">{new Date(showDetail.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Inspection Date</p>
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
            <h2 className="text-lg font-semibold mb-2">Delete Inspection</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this home inspection?</p>
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
