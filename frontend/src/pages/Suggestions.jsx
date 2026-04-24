import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Lightbulb, Loader2, DollarSign, Clock, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['structural', 'kitchen', 'bathroom', 'lighting', 'storage', 'technology', 'windows', 'trim', 'acoustic', 'furniture', 'outdoor', 'other'];
const priorities = ['high', 'medium', 'low'];
const difficulties = ['easy', 'moderate', 'complex'];
const statuses = ['pending', 'in_progress', 'completed'];

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    floor_plan_id: '', title: '', description: '', category: 'structural',
    priority: 'medium', estimated_cost: '', difficulty: 'moderate', timeline: '', status: 'pending'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fpRes, sugRes] = await Promise.all([
        api.getFloorPlans(),
        api.getRenovationSuggestions().catch(() => ({ data: [] }))
      ]);
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      const sugData = Array.isArray(sugRes.data) ? sugRes.data : (sugRes.data?.data || []);
      setSuggestions(sugData);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.floor_plan_id || !formData.title) { toast.error('Please fill required fields'); return; }
    setSaving(true);
    try {
      await api.createRenovationSuggestion(formData);
      toast.success(editingItem ? 'Suggestion updated!' : 'Suggestion created!');
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save suggestion'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      floor_plan_id: item.floor_plan_id, title: item.title, description: item.description || '',
      category: item.category || 'structural', priority: item.priority || 'medium',
      estimated_cost: item.estimated_cost || '', difficulty: item.difficulty || 'moderate',
      timeline: item.timeline || '', status: item.status || 'pending'
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const resetForm = () => {
    setFormData({ floor_plan_id: '', title: '', description: '', category: 'structural', priority: 'medium', estimated_cost: '', difficulty: 'moderate', timeline: '', status: 'pending' });
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || s.floor_plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Renovation Suggestions</h1>
          <p className="text-gray-500 mt-1">AI-powered and manual renovation ideas</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Suggestion
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search suggestions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Suggestion</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Est. Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuggestions.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No suggestions found</p>
                </td></tr>
              ) : filteredSuggestions.map((s) => (
                <tr key={s.id} onClick={() => setShowDetail(s)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Lightbulb className="h-5 w-5 text-yellow-600" /></div>
                      <div>
                        <p className="font-medium text-gray-800">{s.title}</p>
                        <p className="text-sm text-gray-500">{s.floor_plan_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">{s.category}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${s.priority === 'high' ? 'bg-red-100 text-red-700' : s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{s.priority}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.estimated_cost ? `$${Number(s.estimated_cost).toLocaleString()}` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{(s.status || 'pending').replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEdit(s)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                      <button onClick={() => setShowConfirm(s)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Suggestion' : 'New Suggestion'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan *</label>
                  <select value={formData.floor_plan_id} onChange={(e) => setFormData({ ...formData, floor_plan_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select floor plan</option>
                    {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                  <input type="number" value={formData.estimated_cost} onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <input type="text" value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} placeholder="e.g., 2-3 weeks"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSubmit} disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Suggestion Details</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{showDetail.title}</h3>
                {showDetail.ai_generated && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"><AlertCircle className="h-3 w-3" /> AI Generated</span>
                )}
              </div>
              <p className="text-gray-600">{showDetail.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Category</p><p className="font-medium capitalize">{showDetail.category}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Priority</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${showDetail.priority === 'high' ? 'bg-red-100 text-red-700' : showDetail.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{showDetail.priority}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-1 text-sm text-gray-500"><DollarSign className="h-4 w-4" /> Est. Cost</div>
                  <p className="font-medium">{showDetail.estimated_cost ? `$${Number(showDetail.estimated_cost).toLocaleString()}` : '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-1 text-sm text-gray-500"><Clock className="h-4 w-4" /> Timeline</div>
                  <p className="font-medium">{showDetail.timeline || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Suggestion</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "{showConfirm.title}"?</p>
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
