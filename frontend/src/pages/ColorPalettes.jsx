import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const styleOptions = [
  'Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern',
  'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse', 'Japanese Zen'
];
const moodOptions = ['Calm', 'Energetic', 'Cozy', 'Elegant', 'Playful', 'Professional', 'Romantic', 'Natural'];

const ColorPalettes = () => {
  const [palettes, setPalettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStyle, setFilterStyle] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '', style: '', mood: '', colors: ''
  });

  const fetchPalettes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStyle) params.style = filterStyle;
      if (filterMood) params.mood = filterMood;
      const res = await api.getPalettes(params);
      setPalettes(res.data.palettes || res.data || []);
    } catch (err) {
      toast.error('Failed to load palettes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPalettes();
  }, [filterStyle, filterMood]);

  const parseColors = (colors) => {
    if (!colors) return [];
    try {
      if (typeof colors === 'string') {
        if (colors.startsWith('[')) return JSON.parse(colors);
        return colors.split(',').map(c => c.trim()).filter(Boolean);
      }
      return colors;
    } catch {
      return colors.split(',').map(c => c.trim()).filter(Boolean);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const colorsArr = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
      await api.createPalette({
        name: formData.name,
        style: formData.style,
        mood: formData.mood,
        colors: colorsArr
      });
      toast.success('Palette created successfully');
      setShowCreate(false);
      setFormData({ name: '', style: '', mood: '', colors: '' });
      fetchPalettes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create palette');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this palette?')) return;
    try {
      await api.deletePalette(id);
      toast.success('Palette deleted');
      setPalettes(palettes.filter(p => p.id !== id));
      if (selectedPalette?.id === id) setSelectedPalette(null);
    } catch (err) {
      toast.error('Failed to delete palette');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Color Palettes</h1>
          <p className="text-gray-600">Discover and create harmonious color combinations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Palette
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Styles</option>
          {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Moods</option>
          {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Palettes Grid */}
      {palettes.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No palettes found</p>
          <button onClick={() => setShowCreate(true)} className="text-primary-600 font-medium hover:text-primary-700">
            Create your first palette
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {palettes.map(palette => {
            const colors = parseColors(palette.colors);
            return (
              <div
                key={palette.id}
                onClick={() => setSelectedPalette(palette)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
              >
                {/* Color swatches */}
                <div className="flex h-24">
                  {colors.length > 0 ? (
                    colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: typeof color === 'string' ? color : color.hex }}
                      />
                    ))
                  ) : (
                    <div className="flex-1 bg-gradient-to-r from-primary-200 via-secondary-200 to-amber-200" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{palette.name || palette.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {palette.style && (
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{palette.style}</span>
                    )}
                    {palette.mood && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{palette.mood}</span>
                    )}
                  </div>
                  {palette.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{palette.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPalette && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{selectedPalette.name || selectedPalette.title}</h2>
              <button onClick={() => setSelectedPalette(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Large swatches */}
              <div className="flex rounded-lg overflow-hidden mb-4 h-32">
                {parseColors(selectedPalette.colors).map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 flex items-end justify-center pb-2"
                    style={{ backgroundColor: typeof color === 'string' ? color : color.hex }}
                  >
                    <span className="text-xs bg-white bg-opacity-80 px-2 py-0.5 rounded-full font-mono">
                      {typeof color === 'string' ? color : color.hex}
                    </span>
                  </div>
                ))}
              </div>

              {selectedPalette.description && (
                <p className="text-gray-600 mb-4">{selectedPalette.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedPalette.style && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Style</p>
                    <p className="font-medium text-gray-800">{selectedPalette.style}</p>
                  </div>
                )}
                {selectedPalette.mood && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Mood</p>
                    <p className="font-medium text-gray-800">{selectedPalette.mood}</p>
                  </div>
                )}
              </div>

              {/* Individual color details */}
              <div className="space-y-2 mb-4">
                {parseColors(selectedPalette.colors).map((color, i) => {
                  const hex = typeof color === 'string' ? color : color.hex;
                  const name = typeof color === 'object' ? color.name : null;
                  const usage = typeof color === 'object' ? color.usage : null;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: hex }} />
                      <div>
                        <p className="text-sm font-mono text-gray-700">{hex}</p>
                        {name && <p className="text-xs text-gray-500">{name}</p>}
                        {usage && <p className="text-xs text-gray-400">{usage}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => { handleDelete(selectedPalette.id); }}
                className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Palette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Palette</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palette Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ocean Breeze"
                  required
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
                    {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select mood</option>
                    {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma-separated hex codes)</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="#264653, #2A9D8F, #E9C46A, #F4A261, #E76F51"
                  required
                />
                {/* Color preview */}
                {formData.colors && (
                  <div className="flex gap-2 mt-2">
                    {formData.colors.split(',').map((c, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: c.trim() }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Palette'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPalettes;
