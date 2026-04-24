import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Search, X, Eye, Star, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const roomTypes = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Home Office', 'Dining Room', 'Kids Room', 'Outdoor'
];

const StylePresets = () => {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [filterRoom, setFilterRoom] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStyles = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filterRoom) params.roomType = filterRoom;
        if (search) params.search = search;
        const res = await api.getStyles(params);
        setStyles(res.data.styles || res.data || []);
      } catch (err) {
        toast.error('Failed to load style presets');
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  }, [filterRoom]);

  const handleSearch = (e) => {
    e.preventDefault();
    const fetchStyles = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filterRoom) params.roomType = filterRoom;
        if (search) params.search = search;
        const res = await api.getStyles(params);
        setStyles(res.data.styles || res.data || []);
      } catch (err) {
        toast.error('Failed to load styles');
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  };

  const openDetail = async (style) => {
    try {
      const res = await api.getStyle(style.id);
      setSelectedStyle(res.data.style || res.data);
    } catch {
      setSelectedStyle(style);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Style Presets</h1>
        <p className="text-gray-600">Browse curated interior design styles for inspiration</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search styles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Room Types</option>
          {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Styles Grid */}
      {styles.length === 0 ? (
        <div className="text-center py-16">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No style presets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {styles.map(style => (
            <div
              key={style.id}
              onClick={() => openDetail(style)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100">
                {style.thumbnail || style.imageUrl ? (
                  <img
                    src={style.thumbnail || style.imageUrl}
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Palette className="w-12 h-12 text-primary-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{style.name}</h3>
                {style.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{style.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {style.style && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{style.style}</span>
                  )}
                  {style.popularity !== undefined && (
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{style.popularity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStyle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{selectedStyle.name}</h2>
              <button onClick={() => setSelectedStyle(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(selectedStyle.thumbnail || selectedStyle.imageUrl) && (
                <img
                  src={selectedStyle.thumbnail || selectedStyle.imageUrl}
                  alt={selectedStyle.name}
                  className="w-full h-56 object-cover rounded-lg mb-4"
                />
              )}

              {selectedStyle.description && (
                <p className="text-gray-600 mb-4">{selectedStyle.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedStyle.style && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Style</p>
                    <p className="font-medium text-gray-800">{selectedStyle.style}</p>
                  </div>
                )}
                {selectedStyle.roomType && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Room Type</p>
                    <p className="font-medium text-gray-800">{selectedStyle.roomType}</p>
                  </div>
                )}
                {selectedStyle.popularity !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Popularity</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-current" /> {selectedStyle.popularity}
                    </p>
                  </div>
                )}
                {selectedStyle.createdAt && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Added</p>
                    <p className="font-medium text-gray-800">{new Date(selectedStyle.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedStyle.characteristics && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Characteristics</h4>
                  <p className="text-sm text-gray-600">{selectedStyle.characteristics}</p>
                </div>
              )}

              {selectedStyle.colors && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Color Palette</h4>
                  <div className="flex gap-2">
                    {(() => {
                      let colorArr = [];
                      try {
                        colorArr = typeof selectedStyle.colors === 'string'
                          ? (selectedStyle.colors.startsWith('[') ? JSON.parse(selectedStyle.colors) : selectedStyle.colors.split(','))
                          : selectedStyle.colors;
                      } catch { colorArr = []; }
                      return colorArr.map((c, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: typeof c === 'string' ? c.trim() : c.hex }}
                          title={typeof c === 'string' ? c.trim() : c.hex}
                        />
                      ));
                    })()}
                  </div>
                </div>
              )}

              {selectedStyle.furniture && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Furniture</h4>
                  <p className="text-sm text-gray-600">{selectedStyle.furniture}</p>
                </div>
              )}

              {selectedStyle.materials && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Materials</h4>
                  <p className="text-sm text-gray-600">{selectedStyle.materials}</p>
                </div>
              )}

              <button
                onClick={() => navigate(`/ai-tools?style=${selectedStyle.name}`)}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> Use This Style with AI Tools
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylePresets;
