import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, List, Plus, Search, Sparkles, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const styles = [
  'Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern',
  'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse', 'Japanese Zen'
];
const roomTypes = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Home Office', 'Dining Room', 'Kids Room', 'Outdoor'
];
const statuses = ['draft', 'active', 'published', 'completed'];

const Designs = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', style: '', roomType: '', budget: ''
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStyle) params.style = filterStyle;
      if (filterRoom) params.roomType = filterRoom;
      if (search) params.search = search;
      const res = await api.getDesigns(params);
      setDesigns(res.data.designs || res.data || []);
    } catch (err) {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [filterStatus, filterStyle, filterRoom]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDesigns();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createDesign({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      });
      toast.success('Design created successfully');
      const newId = res.data.id || res.data.design?.id;
      if (newId) {
        navigate(`/designs/${newId}`);
      } else {
        setShowCreateForm(false);
        setFormData({ title: '', description: '', style: '', roomType: '', budget: '' });
        fetchDesigns();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create design');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': case 'completed': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Designs</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Design
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Styles</option>
          {styles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Rooms</option>
          {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Design Grid / List */}
      {designs.length === 0 ? (
        <div className="text-center py-16">
          <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No designs found</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-primary-600 font-medium hover:text-primary-700"
          >
            Create your first design
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map(design => (
            <div
              key={design.id}
              onClick={() => navigate(`/designs/${design.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100">
                {design.thumbnail || design.imageUrl ? (
                  <img
                    src={design.thumbnail || design.imageUrl}
                    alt={design.title || design.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <LayoutGrid className="w-12 h-12 text-primary-300" />
                  </div>
                )}
                {design.aiGenerated && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
                {design.status && (
                  <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full ${getStatusColor(design.status)}`}>
                    {design.status}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{design.title || design.name}</h3>
                {design.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{design.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {design.style && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{design.style}</span>
                  )}
                  {design.roomType && (
                    <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-1 rounded-full">{design.roomType}</span>
                  )}
                </div>
                {design.budget && (
                  <p className="mt-2 text-sm font-semibold text-primary-600">${design.budget.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {designs.map(design => (
            <div
              key={design.id}
              onClick={() => navigate(`/designs/${design.id}`)}
              className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-pointer"
            >
              {(design.thumbnail || design.imageUrl) && (
                <img
                  src={design.thumbnail || design.imageUrl}
                  alt={design.title || design.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800">{design.title || design.name}</h4>
                {design.description && (
                  <p className="text-sm text-gray-500 truncate">{design.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {design.style && <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{design.style}</span>}
                  {design.roomType && <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-0.5 rounded-full">{design.roomType}</span>}
                </div>
              </div>
              {design.status && (
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(design.status)}`}>
                  {design.status}
                </span>
              )}
              {design.budget && (
                <span className="text-sm font-semibold text-primary-600 whitespace-nowrap">${design.budget.toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Design Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Design</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Dream Living Room"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your design vision..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select style</option>
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select room</option>
                    {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Design'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Designs;
