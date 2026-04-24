import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search, Square, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const roomTypes = ['living', 'bedroom', 'kitchen', 'bathroom', 'dining', 'office', 'entry', 'outdoor', 'storage', 'other'];

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloorPlan, setFilterFloorPlan] = useState('');
  const [filterType, setFilterType] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    floor_plan_id: '', name: '', room_type: 'living', width: '', length: '', height: '9', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, fpRes] = await Promise.all([
        api.getFloorPlanRooms ? api.getFloorPlanRooms() : Promise.resolve({ data: [] }),
        api.getFloorPlans()
      ]);
      const roomData = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data?.data || []);
      const fpData = Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []);
      setRooms(roomData);
      setFloorPlans(fpData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        area: formData.width && formData.length ? (parseFloat(formData.width) * parseFloat(formData.length)).toFixed(1) : ''
      };
      if (editingItem) {
        await api.updateFloorPlanRoom ? api.updateFloorPlanRoom(editingItem.id, submitData) : null;
        toast.success('Room updated!');
      } else {
        await api.createFloorPlanRoom(submitData);
        toast.success('Room created!');
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      floor_plan_id: item.floor_plan_id,
      name: item.name,
      room_type: item.room_type || 'living',
      width: item.width || '',
      length: item.length || '',
      height: item.height || '9',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      if (api.deleteFloorPlanRoom) await api.deleteFloorPlanRoom(showConfirm.id);
      setShowConfirm(null);
      fetchData();
      toast.success('Room deleted!');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const resetForm = () => {
    setFormData({ floor_plan_id: floorPlans[0]?.id || '', name: '', room_type: 'living', width: '', length: '', height: '9', notes: '' });
  };

  const calculatedArea = formData.width && formData.length ? (parseFloat(formData.width) * parseFloat(formData.length)).toFixed(1) : '';

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !searchTerm || room.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFP = !filterFloorPlan || String(room.floor_plan_id) === filterFloorPlan;
    const matchesType = !filterType || room.room_type === filterType;
    return matchesSearch && matchesFP && matchesType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rooms</h1>
          <p className="text-gray-500 mt-1">Manage room dimensions and details</p>
        </div>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2" disabled={floorPlans.length === 0}>
          <Plus className="h-5 w-5" /> New Room
        </button>
      </div>

      {floorPlans.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Please create a floor plan first before adding rooms.
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterFloorPlan} onChange={(e) => setFilterFloorPlan(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">All Floor Plans</option>
          {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">All Types</option>
          {roomTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Dimensions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Area</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Floor Plan</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRooms.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No rooms found</td></tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Square className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-800">{room.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">{room.room_type}</span></td>
                    <td className="px-6 py-4 text-gray-600">{room.width} x {room.length} x {room.height} ft</td>
                    <td className="px-6 py-4 text-gray-600">{room.area} sqft</td>
                    <td className="px-6 py-4 text-gray-600">{room.floor_plan_name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(room)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                        <button onClick={() => setShowConfirm(room)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit Room' : 'New Room'}</h2>
              <button onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan *</label>
                <select value={formData.floor_plan_id} onChange={(e) => setFormData({ ...formData, floor_plan_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required>
                  <option value="">Select a floor plan</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select value={formData.room_type} onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {roomTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (ft)</label>
                  <input type="number" step="0.1" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (ft)</label>
                  <input type="number" step="0.1" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (ft)</label>
                  <input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {calculatedArea && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Calculated Area: <span className="font-semibold">{calculatedArea} sqft</span></p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Room</h2>
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
