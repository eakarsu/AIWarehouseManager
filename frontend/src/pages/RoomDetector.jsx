import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import { ScanSearch, Trash2, Plus, Loader2, Eye, Cpu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomDetector() {
  const [detections, setDetections] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fpRes] = await Promise.all([api.getFloorPlans()]);
      const fpData = Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []);
      setFloorPlans(fpData);
      // Try to load existing detections if endpoint exists
      try {
        const detRes = await api.getFullAnalyses();
        const detData = Array.isArray(detRes.data) ? detRes.data : (detRes.data?.data || []);
        setDetections(detData.filter(d => d.analysis_type === 'room_detection'));
      } catch { setDetections([]); }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          try {
            const MAX_DIM = 1500;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              const scale = MAX_DIM / Math.max(width, height);
              width = Math.round(width * scale); height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            setUploadedImage(canvas.toDataURL('image/png'));
          } catch { setUploadedImage(dataUrl); }
        };
        img.onerror = () => setUploadedImage(dataUrl);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }, maxFiles: 1
  });

  const handleAnalyze = async () => {
    if (!selectedFloorPlan && !uploadedImage) {
      toast.error('Please select a floor plan or upload an image');
      return;
    }
    setAnalyzing(true);
    try {
      let imageData = uploadedImage;
      if (selectedFloorPlan && !uploadedImage) {
        const fp = floorPlans.find(f => f.id === parseInt(selectedFloorPlan));
        if (fp?.image_data) imageData = fp.image_data;
      }
      const response = await api.aiDetectRooms({ floor_plan_id: selectedFloorPlan || null, image_data: imageData });
      if (response.data.success !== false) {
        toast.success('Room detection completed!');
        setShowModal(false);
        setUploadedImage(null);
        setSelectedFloorPlan('');
        fetchData();
      } else {
        toast.error(response.data.error || 'Detection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Detection failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteFullAnalysis(showConfirm.id);
      setShowConfirm(null);
      fetchData();
      toast.success('Detection deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Room Detector</h1>
          <p className="text-gray-500 mt-1">Automatically detect and identify rooms from floor plans</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="h-5 w-5" /> New Detection
        </button>
      </div>

      {detections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ScanSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Room Detections Yet</h3>
          <p className="text-gray-500 mb-4">Upload a floor plan to automatically detect rooms</p>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Start Detection</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detections.map((detection) => (
            <div key={detection.id} onClick={() => setShowDetail(detection)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ScanSearch className="h-6 w-6 text-purple-600" />
                </div>
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
                  {detection.total_rooms || 0} rooms
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{detection.floor_plan_name || 'Floor Plan'}</h3>
              <p className="text-sm text-gray-500 mb-3">Confidence: {detection.confidence_score?.toFixed(1) || '-'}%</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{new Date(detection.created_at).toLocaleDateString()}</span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowDetail(detection)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => setShowConfirm(detection)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Detection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">New Room Detection</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Floor Plan</label>
                <select value={selectedFloorPlan} onChange={(e) => setSelectedFloorPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a floor plan...</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">or upload new image</span></div>
              </div>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div>
                    <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto mb-2 rounded" />
                    <p className="text-sm text-green-600">Image uploaded - click to change</p>
                  </div>
                ) : (
                  <div>
                    <ScanSearch className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Drag & drop an image, or click to select</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAnalyze} disabled={analyzing || (!selectedFloorPlan && !uploadedImage)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {analyzing ? 'Detecting...' : 'Detect Rooms'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Room Detection Results</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><ScanSearch className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Cpu className="h-3 w-3" />{showDetail.model_used}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{showDetail.total_rooms || '-'}</p>
                    <p className="text-sm text-gray-500">rooms detected</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Confidence Score</p>
                  <p className="text-xl font-semibold text-green-600">{showDetail.confidence_score?.toFixed(1) || '-'}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Analyzed On</p>
                  <p className="font-medium">{new Date(showDetail.created_at).toLocaleString()}</p>
                </div>
              </div>
              {showDetail.full_result && (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">{showDetail.full_result}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Detection</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this room detection?</p>
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
