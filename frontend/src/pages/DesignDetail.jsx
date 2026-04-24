import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Settings, Trash2, Download, ShoppingCart, Plus, Eye, X,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import RoomViewer from '../components/RoomViewer';
import ComparisonSlider from '../components/ComparisonSlider';
import * as api from '../services/api';

const DesignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showRoomViewer, setShowRoomViewer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedSection, setExpandedSection] = useState({
    rooms: true, furniture: true, details: true
  });

  const styles = [
    'Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern',
    'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse', 'Japanese Zen'
  ];
  const roomTypes = [
    'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
    'Home Office', 'Dining Room', 'Kids Room', 'Outdoor'
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [designRes, roomsRes] = await Promise.all([
          api.getDesign(id),
          api.getDesignRooms(id).catch(() => ({ data: [] }))
        ]);
        const designData = designRes.data.design || designRes.data;
        setDesign(designData);
        setEditForm(designData);
        setRooms(roomsRes.data.rooms || roomsRes.data || []);
      } catch (err) {
        toast.error('Failed to load design');
        navigate('/designs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDesign(id, editForm);
      setDesign({ ...design, ...editForm });
      setEditing(false);
      toast.success('Design updated successfully');
    } catch (err) {
      toast.error('Failed to update design');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    try {
      await api.deleteDesign(id);
      toast.success('Design deleted');
      navigate('/designs');
    } catch (err) {
      toast.error('Failed to delete design');
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.loading('Generating PDF...');
      const res = await api.exportDesignPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('PDF downloaded');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  const handleCreateShoppingList = async () => {
    try {
      const res = await api.createShoppingListFromDesign(id);
      toast.success('Shopping list created');
      const listId = res.data.id || res.data.shoppingList?.id;
      if (listId) navigate(`/shopping?list=${listId}`);
    } catch (err) {
      toast.error('Failed to create shopping list');
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': case 'completed': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-blue-100 text-blue-700';
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

  if (!design) {
    return <div className="text-center py-12 text-gray-500">Design not found</div>;
  }

  return (
    <div className="animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate('/designs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Designs
      </button>

      {/* Hero section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {(design.thumbnail || design.imageUrl) && (
          <div className="aspect-video max-h-96 overflow-hidden relative">
            <img
              src={design.thumbnail || design.imageUrl}
              alt={design.title || design.name}
              className="w-full h-full object-cover"
            />
            {design.beforeImage && design.afterImage && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="absolute bottom-4 right-4 bg-white text-gray-700 px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4" /> Before/After
              </button>
            )}
          </div>
        )}

        <div className="p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title || editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={editForm.style || ''}
                    onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select style</option>
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    value={editForm.roomType || ''}
                    onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  value={editForm.budget || ''}
                  onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditForm(design); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{design.title || design.name}</h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {design.style && (
                      <span className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full">{design.style}</span>
                    )}
                    {design.roomType && (
                      <span className="text-sm bg-secondary-50 text-secondary-700 px-3 py-1 rounded-full">{design.roomType}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {design.status && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(design.status)}`}>
                      {design.status}
                    </span>
                  )}
                </div>
              </div>

              {design.description && (
                <p className="text-gray-600 mb-6">{design.description}</p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {design.budget && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium text-gray-800">${design.budget.toLocaleString()}</p>
                  </div>
                )}
                {design.createdAt && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-800">{new Date(design.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                {rooms.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Rooms</p>
                    <p className="font-medium text-gray-800">{rooms.length}</p>
                  </div>
                )}
                {design.aiGenerated && (
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Source</p>
                    <p className="font-medium text-primary-700 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> AI Generated
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleExportPdf}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
                <button
                  onClick={handleCreateShoppingList}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Shopping List
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition flex items-center gap-2 ml-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Before/After Comparison */}
      {showComparison && design.beforeImage && design.afterImage && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Before / After Comparison</h2>
            <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ComparisonSlider
            beforeImage={design.beforeImage}
            afterImage={design.afterImage}
            beforeLabel="Before"
            afterLabel="After"
          />
        </div>
      )}

      {/* Rooms Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <button
          onClick={() => toggleSection('rooms')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-800">Rooms ({rooms.length})</h2>
          {expandedSection.rooms ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {expandedSection.rooms && (
          <div className="p-4">
            {rooms.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No rooms added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div
                    key={room.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => { setSelectedRoom(room); setShowRoomViewer(true); }}
                  >
                    {room.thumbnail && (
                      <img src={room.thumbnail} alt={room.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                    )}
                    <h3 className="font-medium text-gray-800">{room.name}</h3>
                    {room.type && <p className="text-sm text-gray-500">{room.type}</p>}
                    {room.dimensions && (
                      <p className="text-xs text-gray-400 mt-1">
                        {room.dimensions.width}m x {room.dimensions.length}m
                      </p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); setShowRoomViewer(true); }}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View 3D
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Furniture Section */}
      {design.furniture && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => toggleSection('furniture')}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800">Furniture</h2>
            {expandedSection.furniture ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {expandedSection.furniture && (
            <div className="p-4">
              {typeof design.furniture === 'string' ? (
                <p className="text-gray-600">{design.furniture}</p>
              ) : Array.isArray(design.furniture) ? (
                <div className="space-y-2">
                  {design.furniture.map((item, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                      </div>
                      {item.price && (
                        <span className="font-semibold text-primary-600">${item.price.toLocaleString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Color Palette */}
      {design.colors && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Color Palette</h2>
          <div className="flex gap-3 flex-wrap">
            {(() => {
              let colorArr = [];
              try {
                colorArr = typeof design.colors === 'string'
                  ? (design.colors.startsWith('[') ? JSON.parse(design.colors) : design.colors.split(','))
                  : design.colors;
              } catch { colorArr = []; }
              return colorArr.map((c, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-14 h-14 rounded-lg shadow-sm border border-gray-200"
                    style={{ backgroundColor: typeof c === 'string' ? c.trim() : c.hex }}
                    title={typeof c === 'string' ? c.trim() : c.hex}
                  />
                  <p className="text-xs text-gray-500 mt-1">{typeof c === 'string' ? c.trim() : c.name || c.hex}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 3D Room Viewer Modal */}
      {showRoomViewer && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">3D Room View - {selectedRoom.name}</h2>
              <button onClick={() => setShowRoomViewer(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[60vh]">
              <RoomViewer room={selectedRoom} design={design} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignDetail;
