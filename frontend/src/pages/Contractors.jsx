import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Users, Loader2, Star, Phone, Mail, MapPin, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const specialties = ['general', 'plumbing', 'electrical', 'flooring', 'painting', 'kitchen', 'bathroom', 'hvac', 'roofing', 'windows', 'tile', 'carpentry', 'interior design', 'masonry', 'landscaping', 'smart home'];
const availabilities = ['available', 'busy', 'unavailable'];

export default function Contractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', specialty: 'general', email: '', phone: '',
    rating: '', hourly_rate: '', availability: 'available', location: '', verified: false,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.getContractors();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setContractors(data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      toast.success(editingItem ? 'Contractor updated!' : 'Contractor created!');
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save contractor'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, company: item.company || '', specialty: item.specialty || 'general',
      email: item.email || '', phone: item.phone || '', rating: item.rating || '',
      hourly_rate: item.hourly_rate || '', availability: item.availability || 'available',
      location: item.location || '', verified: item.verified ?? false,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try { setShowConfirm(null); fetchData(); toast.success('Deleted!'); } catch { toast.error('Failed'); }
  };

  const resetForm = () => {
    setFormData({ name: '', company: '', specialty: 'general', email: '', phone: '', rating: '', hourly_rate: '', availability: 'available', location: '', verified: false });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      else if (i === fullStars && hasHalf) stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      else stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
    }
    return stars;
  };

  const filteredContractors = contractors.filter(c => {
    const matchSearch = !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpecialty = !filterSpecialty || c.specialty === filterSpecialty;
    return matchSearch && matchSpecialty;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contractors</h1>
          <p className="text-gray-500 mt-1">Find and manage local contractors</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Contractor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search contractors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">All Specialties</option>
          {specialties.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Contractors Found</h3>
            <p className="text-gray-500">Add contractors to your directory</p>
          </div>
        ) : filteredContractors.map((contractor) => (
          <div key={contractor.id} onClick={() => setShowDetail(contractor)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center"><Users className="h-6 w-6 text-teal-600" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{contractor.name}</h3>
                    {contractor.verified && (
                      <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-white" /></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{contractor.company}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {renderStars(contractor.rating || 0)}
              <span className="ml-1 text-sm text-gray-600">({contractor.rating || 0})</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded capitalize">{contractor.specialty}</span>
                <span className={`px-2 py-1 rounded ${contractor.availability === 'available' ? 'bg-green-100 text-green-700' : contractor.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{contractor.availability}</span>
              </div>
              {contractor.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><span>{contractor.location}</span></div>}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-lg font-semibold text-indigo-600">${contractor.hourly_rate}/hr</span>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleEdit(contractor)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => setShowConfirm(contractor)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Contractor' : 'New Contractor'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {specialties.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {availabilities.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="verified" checked={formData.verified} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="verified" className="text-sm font-medium text-gray-700">Verified Contractor</label>
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
              <h2 className="text-xl font-semibold">Contractor Details</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center"><Users className="h-8 w-8 text-teal-600" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-800">{showDetail.name}</h3>
                    {showDetail.verified && <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><Check className="h-4 w-4 text-white" /></span>}
                  </div>
                  <p className="text-gray-500">{showDetail.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">{renderStars(showDetail.rating || 0)}<span className="ml-2 text-gray-600">{showDetail.rating || 0} rating</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Specialty</p><p className="font-medium capitalize">{showDetail.specialty}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Hourly Rate</p><p className="font-medium text-indigo-600">${showDetail.hourly_rate}/hr</p></div>
              </div>
              <div className="space-y-3">
                {showDetail.email && <div className="flex items-center gap-3 text-gray-600"><Mail className="h-5 w-5 text-gray-400" /><span>{showDetail.email}</span></div>}
                {showDetail.phone && <div className="flex items-center gap-3 text-gray-600"><Phone className="h-5 w-5 text-gray-400" /><span>{showDetail.phone}</span></div>}
                {showDetail.location && <div className="flex items-center gap-3 text-gray-600"><MapPin className="h-5 w-5 text-gray-400" /><span>{showDetail.location}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Delete Contractor</h2>
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
