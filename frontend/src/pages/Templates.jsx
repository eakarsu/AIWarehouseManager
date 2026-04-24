import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Palette, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const styles = ['minimalist', 'industrial', 'coastal', 'scandinavian', 'farmhouse', 'mid-century', 'bohemian', 'luxury', 'traditional', 'japanese', 'art-deco', 'rustic', 'urban', 'french', 'tropical', 'mediterranean'];
const roomTypes = ['living', 'bedroom', 'kitchen', 'bathroom', 'dining', 'office', 'entry', 'outdoor'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', style: 'minimalist', description: '', room_type: 'living', features: '', color_palette: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.getTemplates();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setTemplates(data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      toast.success(editingItem ? 'Template updated!' : 'Template created!');
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save template'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const features = Array.isArray(item.features) ? item.features : (typeof item.features === 'string' ? (() => { try { return JSON.parse(item.features); } catch { return []; } })() : []);
    const colors = Array.isArray(item.color_palette) ? item.color_palette : (typeof item.color_palette === 'string' ? (() => { try { return JSON.parse(item.color_palette); } catch { return []; } })() : []);
    setFormData({
      name: item.name, style: item.style || 'minimalist', description: item.description || '',
      room_type: item.room_type || 'living', features: features.join(', '), color_palette: colors.join(', ')
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const resetForm = () => {
    setFormData({ name: '', style: 'minimalist', description: '', room_type: 'living', features: '', color_palette: '' });
  };

  const parseColors = (colorPalette) => {
    if (!colorPalette) return [];
    if (Array.isArray(colorPalette)) return colorPalette;
    try { return JSON.parse(colorPalette); } catch { return []; }
  };

  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try { return JSON.parse(features); } catch { return []; }
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !searchTerm || t.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStyle = !filterStyle || t.style === filterStyle;
    return matchSearch && matchStyle;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Design Templates</h1>
          <p className="text-gray-500 mt-1">Browse design style templates for inspiration</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Template
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">All Styles</option>
          {styles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Templates Found</h3>
            <p className="text-gray-500">Create design templates for inspiration</p>
          </div>
        ) : filteredTemplates.map((template) => {
          const colors = parseColors(template.color_palette);
          const features = parseFeatures(template.features);
          return (
            <div key={template.id} onClick={() => setShowDetail(template)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-24 flex">
                {colors.slice(0, 4).map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
                {colors.length === 0 && <div className="flex-1 bg-gradient-to-r from-pink-100 to-purple-100" />}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{template.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-700 rounded capitalize">{template.style?.replace('-', ' ')}</span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded capitalize">{template.room_type}</span>
                    </div>
                  </div>
                  <Palette className="h-5 w-5 text-pink-500" />
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {features.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded">{f}</span>
                  ))}
                  {features.length > 3 && <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded">+{features.length - 3}</span>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEdit(template)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setShowConfirm(template)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {styles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select value={formData.room_type} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {roomTypes.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <input type="text" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="e.g., open space, minimal furniture, neutral palette"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Palette (hex codes, comma-separated)</label>
                <input type="text" value={formData.color_palette} onChange={(e) => setFormData({ ...formData, color_palette: e.target.value })}
                  placeholder="e.g., #FFFFFF, #F5F5F5, #333333"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
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

      {showDetail && (() => {
        const colors = parseColors(showDetail.color_palette);
        const features = parseFeatures(showDetail.features);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Template Details</h2>
                <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                {colors.length > 0 && (
                  <div className="h-32 flex rounded-lg overflow-hidden">
                    {colors.map((color, i) => (
                      <div key={i} className="flex-1 relative group" style={{ backgroundColor: color }}>
                        <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{color}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{showDetail.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded-full capitalize">{showDetail.style?.replace('-', ' ')}</span>
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full capitalize">{showDetail.room_type}</span>
                  </div>
                </div>
                <p className="text-gray-600">{showDetail.description}</p>
                {features.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {features.map((f, i) => <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">{f}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Template</h2>
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
