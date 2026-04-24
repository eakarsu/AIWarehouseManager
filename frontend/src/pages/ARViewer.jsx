import React, { useState, useEffect, Suspense } from 'react';
import {
  Camera, Plus, X, Trash2, Save, Eye, Box, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import * as api from '../services/api';

const FurnitureBox = ({ position, color, name }) => (
  <mesh position={position} castShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={color || '#8B5CF6'} />
  </mesh>
);

const Room3D = ({ room, furniture }) => {
  const width = room?.dimensions?.width || 5;
  const length = room?.dimensions?.length || 5;
  const height = room?.dimensions?.height || 3;

  return (
    <Canvas camera={{ position: [width * 1.5, height * 1.5, length * 1.5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <Suspense fallback={null}>
        <Environment preset="apartment" />
      </Suspense>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, height / 2, -length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#fafafa" side={2} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color="#f5f5f5" side={2} />
      </mesh>

      {/* Placed furniture */}
      {furniture.map((item, i) => (
        <FurnitureBox
          key={i}
          position={item.position || [i * 1.5 - 1, 0.5, i * 0.5 - 1]}
          color={item.color || ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'][i % 4]}
          name={item.name}
        />
      ))}

      <Grid args={[20, 20]} cellSize={1} cellColor="#e5e7eb" sectionColor="#d1d5db" fadeDistance={30} />
      <OrbitControls makeDefault />
    </Canvas>
  );
};

const ARViewer = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [arFurniture, setArFurniture] = useState([]);
  const [placedFurniture, setPlacedFurniture] = useState([]);
  const [formData, setFormData] = useState({
    name: '', roomType: '', dimensions: { width: 5, length: 5, height: 3 }
  });

  const roomTypes = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Home Office', 'Dining Room'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionsRes, furnitureRes] = await Promise.all([
          api.getARSessions(),
          api.getARReadyFurniture().catch(() => ({ data: [] }))
        ]);
        setSessions(sessionsRes.data.sessions || sessionsRes.data || []);
        setArFurniture(furnitureRes.data.furniture || furnitureRes.data || []);
      } catch (err) {
        toast.error('Failed to load AR sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createARSession(formData);
      toast.success('AR session created');
      const newSession = res.data.session || res.data;
      setSessions([newSession, ...sessions]);
      setSelectedSession(newSession);
      setPlacedFurniture([]);
      setShowCreate(false);
      setFormData({ name: '', roomType: '', dimensions: { width: 5, length: 5, height: 3 } });
    } catch (err) {
      toast.error('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this AR session?')) return;
    try {
      await api.deleteARSession(id);
      toast.success('Session deleted');
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setPlacedFurniture([]);
      }
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  const handlePlaceFurniture = (item) => {
    const newItem = {
      ...item,
      position: [
        (Math.random() - 0.5) * 3,
        0.5,
        (Math.random() - 0.5) * 3
      ]
    };
    setPlacedFurniture([...placedFurniture, newItem]);
    toast.success(`Placed "${item.name}" in room`);
  };

  const handleRemoveFurniture = (index) => {
    setPlacedFurniture(placedFurniture.filter((_, i) => i !== index));
  };

  const handleSaveSnapshot = async () => {
    if (!selectedSession) return;
    try {
      await api.createARSnapshot(selectedSession.id, {
        furniture: placedFurniture,
        timestamp: new Date().toISOString()
      });
      toast.success('Snapshot saved');
    } catch (err) {
      toast.error('Failed to save snapshot');
    }
  };

  const openSession = async (session) => {
    try {
      const res = await api.getARSession(session.id);
      const data = res.data.session || res.data;
      setSelectedSession(data);
      setPlacedFurniture(data.furniture || data.placedItems || []);
    } catch {
      setSelectedSession(session);
      setPlacedFurniture([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Session detail view
  if (selectedSession) {
    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => { setSelectedSession(null); setPlacedFurniture([]); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <RotateCcw className="w-4 h-4" /> Back to Sessions
        </button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{selectedSession.name || 'AR Session'}</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSaveSnapshot}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Snapshot
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 3D Viewer */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '500px' }}>
            <Room3D
              room={selectedSession}
              furniture={placedFurniture}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Placed furniture */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Placed Items ({placedFurniture.length})</h3>
              {placedFurniture.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No items placed yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {placedFurniture.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                      <button
                        onClick={() => handleRemoveFurniture(i)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available furniture */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">AR Ready Furniture</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {arFurniture.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No AR-ready furniture available</p>
                ) : (
                  arFurniture.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handlePlaceFurniture(item)}
                      className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-primary-50 rounded-lg transition text-left"
                    >
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Box className="w-8 h-8 text-gray-400 p-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                        {item.price && <p className="text-xs text-primary-600">${item.price}</p>}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sessions list view
  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">AR Experience</h1>
          <p className="text-gray-600">View and arrange furniture in 3D rooms</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No AR sessions yet</p>
          <button onClick={() => setShowCreate(true)} className="text-primary-600 font-medium hover:text-primary-700">
            Create your first session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              <div
                className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center cursor-pointer"
                onClick={() => openSession(session)}
              >
                {session.thumbnail ? (
                  <img src={session.thumbnail} alt={session.name} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-primary-300" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{session.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {session.roomType && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{session.roomType}</span>
                  )}
                  {session.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>{session.status}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openSession(session)}
                    className="flex-1 bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Open
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">New AR Session</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Living Room"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select room type</option>
                  {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                  <input
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={1}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={1}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
                  <input
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={1}
                    step={0.5}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARViewer;
