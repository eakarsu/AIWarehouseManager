import { useState, useEffect } from 'react';
import api from '../services/api';
import { Home, Trash2, Plus, Loader2, Eye, DollarSign, Target, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

const targetBuyers = [
  { value: 'general', label: 'General Buyers' },
  { value: 'young professionals', label: 'Young Professionals' },
  { value: 'families with children', label: 'Families with Children' },
  { value: 'luxury seekers', label: 'Luxury Seekers' },
  { value: 'first-time buyers', label: 'First-Time Buyers' },
  { value: 'retirees', label: 'Retirees' },
  { value: 'investors', label: 'Investors' },
];

export default function HomeStaging() {
  const [stagingList, setStagingList] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [formData, setFormData] = useState({ floor_plan_id: '', room_id: '', target_buyer: 'general' });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (formData.floor_plan_id) fetchRooms(formData.floor_plan_id); }, [formData.floor_plan_id]);

  const fetchData = async () => {
    try {
      const fpRes = await api.getFloorPlans();
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      setStagingList([]);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const fetchRooms = async (floorPlanId) => {
    try {
      const response = await api.getFloorPlanRooms(floorPlanId);
      setRooms(Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch { setRooms([]); }
  };

  const handleAnalyze = async () => {
    if (!formData.floor_plan_id) { toast.error('Please select a floor plan'); return; }
    setAnalyzing(true);
    try {
      const response = await api.aiHomeStaging(formData);
      if (response.data.success !== false) {
        toast.success('Staging advice generated!');
        setShowModal(false);
        setFormData({ floor_plan_id: '', room_id: '', target_buyer: 'general' });
        fetchData();
      } else { toast.error(response.data.error || 'Failed'); }
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to generate advice'); }
    finally { setAnalyzing(false); }
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Home Staging Advisor</h1>
          <p className="text-gray-500 mt-1">Get professional staging recommendations to maximize property appeal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Staging Advice
        </button>
      </div>

      {stagingList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Staging Advice Yet</h3>
          <p className="text-gray-500 mb-4">Get AI-powered staging recommendations for your properties</p>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Get Staging Advice</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stagingList.map((item) => (
            <div key={item.id} onClick={() => setShowDetail(item)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center"><Home className="h-6 w-6 text-pink-600" /></div>
                <span className="px-3 py-1 text-sm font-medium bg-pink-100 text-pink-700 rounded-full capitalize">{item.staging_style}</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.floor_plan_name}</h3>
              {item.room_name && <p className="text-sm text-indigo-600 mb-2">{item.room_name}</p>}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3"><Target className="h-4 w-4" /><span className="capitalize">{item.target_buyer}</span></div>
              {item.estimated_value_increase && (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-3"><DollarSign className="h-4 w-4" /><span>+{formatCurrency(item.estimated_value_increase)}</span></div>
              )}
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
              <h2 className="text-xl font-semibold">Get Staging Advice</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan *</label>
                <select value={formData.floor_plan_id} onChange={(e) => setFormData({ ...formData, floor_plan_id: e.target.value, room_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a floor plan...</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              {formData.floor_plan_id && rooms.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <select value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">All rooms / General</option>
                    {rooms.map(room => <option key={room.id} value={room.id}>{room.name} ({room.room_type})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Buyer</label>
                <select value={formData.target_buyer} onChange={(e) => setFormData({ ...formData, target_buyer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {targetBuyers.map(buyer => <option key={buyer.value} value={buyer.value}>{buyer.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAnalyze} disabled={analyzing || !formData.floor_plan_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />} {analyzing ? 'Generating...' : 'Get Advice'}
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
              <h2 className="text-xl font-semibold">Staging Recommendations</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                      {showDetail.room_name && <p className="text-sm text-pink-600">{showDetail.room_name}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Est. Value Increase</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(showDetail.estimated_value_increase)}</p>
                  </div>
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
            <h2 className="text-lg font-semibold mb-2">Delete Staging Advice</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this staging advice?</p>
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
