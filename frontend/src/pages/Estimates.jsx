import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Calculator, Loader2, DollarSign, Clock, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';

const statuses = ['draft', 'pending', 'approved', 'in_progress', 'completed'];
const statusLabel = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : '';
const statusBadgeClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700';
    case 'completed': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-yellow-100 text-yellow-700';
    case 'pending': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    floor_plan_id: '', name: '', description: '', labor_cost: '', material_cost: '', timeline_days: '', status: 'draft'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fpRes, estRes] = await Promise.all([
        api.getFloorPlans(),
        api.getProjectEstimates().catch(() => ({ data: [] }))
      ]);
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      const estData = Array.isArray(estRes.data) ? estRes.data : (estRes.data?.data || []);
      setEstimates(estData);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.floor_plan_id || !formData.name) { toast.error('Please fill required fields'); return; }
    setSaving(true);
    try {
      await api.createProjectEstimate(formData);
      toast.success(editingItem ? 'Estimate updated!' : 'Estimate created!');
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save estimate'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      floor_plan_id: item.floor_plan_id, name: item.name, description: item.description || '',
      labor_cost: item.labor_cost || '', material_cost: item.material_cost || '',
      timeline_days: item.timeline_days || '', status: item.status || 'draft'
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const resetForm = () => {
    setFormData({ floor_plan_id: '', name: '', description: '', labor_cost: '', material_cost: '', timeline_days: '', status: 'draft' });
  };

  const filteredEstimates = estimates.filter(e =>
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.floor_plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm
  );

  const totalBudget = filteredEstimates.reduce((acc, e) => acc + (Number(e.total_cost) || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Project Estimates</h1>
          <p className="text-gray-500 mt-1">Track renovation costs and timelines</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Estimate
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Total Budget</p><p className="text-2xl font-bold text-gray-800">${totalBudget.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Calculator className="h-6 w-6 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total Estimates</p><p className="text-2xl font-bold text-gray-800">{estimates.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-gray-800">{estimates.filter(e => e.status === 'approved').length}</p></div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search estimates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Labor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Materials</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Timeline</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEstimates.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No estimates found</p>
                </td></tr>
              ) : filteredEstimates.map((est) => (
                <tr key={est.id} onClick={() => setShowDetail(est)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Calculator className="h-5 w-5 text-purple-600" /></div>
                      <div><p className="font-medium text-gray-800">{est.name}</p><p className="text-sm text-gray-500">{est.floor_plan_name}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">${Number(est.labor_cost || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">${Number(est.material_cost || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">${Number(est.total_cost || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{est.timeline_days ? `${est.timeline_days} days` : '-'}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadgeClass(est.status)}`}>{statusLabel(est.status)}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEdit(est)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                      <button onClick={() => setShowConfirm(est)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
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
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Estimate' : 'New Estimate'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan *</label>
                <select value={formData.floor_plan_id} onChange={(e) => setFormData({ ...formData, floor_plan_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select floor plan</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost ($)</label>
                  <input type="number" value={formData.labor_cost} onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost ($)</label>
                  <input type="number" value={formData.material_cost} onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (days)</label>
                  <input type="number" value={formData.timeline_days} onChange={(e) => setFormData({ ...formData, timeline_days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
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
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Estimate Details</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div><h3 className="text-xl font-semibold text-gray-800">{showDetail.name}</h3><p className="text-gray-500">{showDetail.floor_plan_name}</p></div>
              <p className="text-gray-600">{showDetail.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm text-blue-600">Labor Cost</p><p className="text-xl font-bold text-blue-700">${Number(showDetail.labor_cost || 0).toLocaleString()}</p></div>
                <div className="p-4 bg-orange-50 rounded-lg"><p className="text-sm text-orange-600">Material Cost</p><p className="text-xl font-bold text-orange-700">${Number(showDetail.material_cost || 0).toLocaleString()}</p></div>
                <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm text-green-600">Total Cost</p><p className="text-xl font-bold text-green-700">${Number(showDetail.total_cost || 0).toLocaleString()}</p></div>
                <div className="p-4 bg-purple-50 rounded-lg"><div className="flex items-center gap-1 text-sm text-purple-600"><Clock className="h-4 w-4" /> Timeline</div><p className="text-xl font-bold text-purple-700">{showDetail.timeline_days ? `${showDetail.timeline_days} days` : '-'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Estimate</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "{showConfirm.name}"?</p>
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
