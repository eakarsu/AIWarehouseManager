import React, { useState, useEffect } from 'react';
import { Heart, Search, X, Eye, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const Inspirations = () => {
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [styleOptions, setStyleOptions] = useState([]);
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [filterStyle, setFilterStyle] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [search, setSearch] = useState('');
  const [selectedInspiration, setSelectedInspiration] = useState(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [stylesRes, roomsRes] = await Promise.all([
          api.getInspirationStyles().catch(() => ({ data: [] })),
          api.getInspirationRoomTypes().catch(() => ({ data: [] }))
        ]);
        setStyleOptions(stylesRes.data.styles || stylesRes.data || []);
        setRoomTypeOptions(roomsRes.data.roomTypes || roomsRes.data || []);
      } catch {
        /* optional meta */
      }
    };
    fetchMeta();
  }, []);

  const fetchInspirations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStyle) params.style = filterStyle;
      if (filterRoom) params.roomType = filterRoom;
      if (search) params.search = search;
      const res = await api.getInspirations(params);
      setInspirations(res.data.inspirations || res.data || []);
    } catch (err) {
      toast.error('Failed to load inspirations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspirations();
  }, [filterStyle, filterRoom]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInspirations();
  };

  const handleLike = async (id) => {
    try {
      await api.likeInspiration(id);
      setInspirations(inspirations.map(insp =>
        insp.id === id ? { ...insp, likes: (insp.likes || 0) + 1, liked: true } : insp
      ));
      if (selectedInspiration?.id === id) {
        setSelectedInspiration({
          ...selectedInspiration,
          likes: (selectedInspiration.likes || 0) + 1,
          liked: true
        });
      }
    } catch (err) {
      toast.error('Failed to like');
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Inspirations</h1>
        <p className="text-gray-600">Discover beautiful interior design ideas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inspirations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Styles</option>
          {styleOptions.map(s => (
            <option key={typeof s === 'string' ? s : s.id} value={typeof s === 'string' ? s : s.name}>
              {typeof s === 'string' ? s : s.name}
            </option>
          ))}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Room Types</option>
          {roomTypeOptions.map(r => (
            <option key={typeof r === 'string' ? r : r.id} value={typeof r === 'string' ? r : r.name}>
              {typeof r === 'string' ? r : r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Masonry-style Grid */}
      {inspirations.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No inspirations found</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {inspirations.map(insp => (
            <div
              key={insp.id}
              className="break-inside-avoid bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedInspiration(insp)}
            >
              {(insp.imageUrl || insp.thumbnail) ? (
                <img
                  src={insp.imageUrl || insp.thumbnail}
                  alt={insp.title || insp.name}
                  className="w-full object-cover"
                  style={{ minHeight: '150px' }}
                />
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <Image className="w-12 h-12 text-primary-300" />
                </div>
              )}
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{insp.title || insp.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {insp.style && (
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{insp.style}</span>
                    )}
                    {insp.roomType && (
                      <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-0.5 rounded-full">{insp.roomType}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(insp.id); }}
                    className={`flex items-center gap-1 text-sm transition ${
                      insp.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${insp.liked ? 'fill-current' : ''}`} />
                    <span>{insp.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInspiration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedInspiration.title || selectedInspiration.name}
              </h2>
              <button onClick={() => setSelectedInspiration(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[75vh]">
              {(selectedInspiration.imageUrl || selectedInspiration.thumbnail) && (
                <img
                  src={selectedInspiration.imageUrl || selectedInspiration.thumbnail}
                  alt={selectedInspiration.title || selectedInspiration.name}
                  className="w-full max-h-96 object-cover"
                />
              )}
              <div className="p-6">
                {selectedInspiration.description && (
                  <p className="text-gray-600 mb-4">{selectedInspiration.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {selectedInspiration.style && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Style</p>
                      <p className="font-medium text-gray-800">{selectedInspiration.style}</p>
                    </div>
                  )}
                  {selectedInspiration.roomType && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Room Type</p>
                      <p className="font-medium text-gray-800">{selectedInspiration.roomType}</p>
                    </div>
                  )}
                  {selectedInspiration.likes !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" /> {selectedInspiration.likes}
                      </p>
                    </div>
                  )}
                  {selectedInspiration.createdAt && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-800">{new Date(selectedInspiration.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {selectedInspiration.tags && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {(typeof selectedInspiration.tags === 'string' ? selectedInspiration.tags.split(',') : selectedInspiration.tags).map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {typeof tag === 'string' ? tag.trim() : tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspiration.colors && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Colors</p>
                    <div className="flex gap-2">
                      {(() => {
                        let colorArr = [];
                        try {
                          colorArr = typeof selectedInspiration.colors === 'string'
                            ? (selectedInspiration.colors.startsWith('[') ? JSON.parse(selectedInspiration.colors) : selectedInspiration.colors.split(','))
                            : selectedInspiration.colors;
                        } catch { colorArr = []; }
                        return colorArr.map((c, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg border border-gray-200"
                            style={{ backgroundColor: typeof c === 'string' ? c.trim() : c.hex }}
                          />
                        ));
                      })()}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleLike(selectedInspiration.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    selectedInspiration.liked
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${selectedInspiration.liked ? 'fill-current' : ''}`} />
                  {selectedInspiration.liked ? 'Liked' : 'Like'} ({selectedInspiration.likes || 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspirations;
