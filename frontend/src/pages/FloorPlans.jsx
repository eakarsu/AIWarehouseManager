import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import {
  Plus, Edit2, Trash2, Eye, Upload, FileImage, Loader2,
  Search, ArrowUpDown, Grid, List, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FloorPlans() {
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', total_area: '', unit: 'sqft', image_data: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFloorPlans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchFloorPlans(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const fetchFloorPlans = async () => {
    try {
      const response = await api.getFloorPlans();
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setFloorPlans(data);
    } catch (error) {
      console.error('Error fetching floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, image_data: reader.result }));
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }, maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.updateFloorPlan(editingItem.id, formData);
        toast.success('Floor plan updated!');
      } else {
        await api.createFloorPlan(formData);
        toast.success('Floor plan created!');
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchFloorPlans();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      total_area: item.total_area || '',
      unit: item.unit || 'sqft',
      image_data: item.image_data || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await api.deleteFloorPlan(showConfirm.id);
      setShowConfirm(null);
      fetchFloorPlans();
      toast.success('Floor plan deleted!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.deleteFloorPlan(id)));
      setSelectedIds([]);
      fetchFloorPlans();
      toast.success(`Deleted ${selectedIds.length} floor plans!`);
    } catch (error) {
      toast.error('Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const resetForm = () => setFormData({ name: '', description: '', total_area: '', unit: 'sqft', image_data: '' });

  const filteredPlans = floorPlans.filter(fp => {
    const matchesSearch = !searchTerm || fp.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || fp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Floor Plans</h1>
          <p className="text-gray-500 mt-1">Manage your floor plan uploads</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Floor Plan
        </button>
      </div>

      {/* Search, Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search floor plans..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="analyzed">Analyzed</option>
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Grid className="h-5 w-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-3 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.length} selected</span>
          <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Clear</button>
        </div>
      )}

      {/* Floor Plans Grid/List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileImage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Floor Plans Found</h3>
          <p className="text-gray-500 mb-4">Upload your first floor plan to get started</p>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Upload Floor Plan
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((fp) => (
            <div key={fp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                {fp.image_data ? (
                  <img src={fp.image_data} alt={fp.name} className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="h-16 w-16 text-gray-300" />
                )}
                <input type="checkbox" checked={selectedIds.includes(fp.id)}
                  onChange={() => toggleSelect(fp.id)}
                  className="absolute top-3 left-3 w-5 h-5 text-indigo-600 rounded" onClick={(e) => e.stopPropagation()} />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{fp.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${fp.status === 'analyzed' ? 'bg-green-100 text-green-700' : fp.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {fp.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{fp.total_area ? `${fp.total_area} ${fp.unit || 'sqft'}` : 'No area set'}</p>
                <p className="text-xs text-gray-400">{new Date(fp.created_at).toLocaleDateString()}</p>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => navigate(`/floor-plans/${fp.id}`)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => handleEdit(fp)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setShowConfirm(fp)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Area</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.map((fp) => (
                  <tr key={fp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/floor-plans/${fp.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><FileImage className="h-5 w-5 text-indigo-600" /></div>
                        <div>
                          <p className="font-medium text-gray-800">{fp.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{fp.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{fp.total_area ? `${fp.total_area} ${fp.unit || 'sqft'}` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${fp.status === 'analyzed' ? 'bg-green-100 text-green-700' : fp.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{fp.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(fp.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEdit(fp)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => setShowConfirm(fp)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Floor Plan' : 'New Floor Plan'}</h2>
              <button onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Area</label>
                  <input type="number" value={formData.total_area} onChange={(e) => setFormData({ ...formData, total_area: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="sqft">Square Feet</option>
                    <option value="sqm">Square Meters</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan Image</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                  <input {...getInputProps()} />
                  {formData.image_data ? (
                    <div className="space-y-2">
                      <img src={formData.image_data} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                      <p className="text-sm text-gray-500">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="text-gray-600">Drag & drop an image here, or click to select</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Floor Plan</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "{showConfirm.name}"? This will also delete all associated rooms and suggestions.</p>
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
