import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import { Ruler, Trash2, Eye, Upload, Loader2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dimensions() {
  const [dimensions, setDimensions] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState('');
  const [imageData, setImageData] = useState('');
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fpRes, dimRes] = await Promise.all([
        api.getFloorPlans(),
        api.getFullAnalyses().catch(() => ({ data: [] }))
      ]);
      setFloorPlans(Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []));
      const dimData = Array.isArray(dimRes.data) ? dimRes.data : (dimRes.data?.data || []);
      setDimensions(dimData.filter(d => d.analysis_type === 'dimensions'));
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => { try { const M=1500; let {width:w,height:h}=img; if(w>M||h>M){const s=M/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);} const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);setImageData(c.toDataURL('image/png')); } catch{setImageData(dataUrl);} };
        img.onerror = () => setImageData(dataUrl);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.png','.jpg','.jpeg','.gif','.webp'] }, maxFiles: 1 });

  const handleAnalyze = async () => {
    if (!selectedFloorPlan && !imageData) { toast.error('Please select a floor plan or upload an image'); return; }
    setAnalyzing(true); setAiResult(null);
    try {
      const selectedFp = floorPlans.find(fp => fp.id == selectedFloorPlan);
      const response = await api.aiAnalyze({ floor_plan_id: selectedFloorPlan || undefined, analysis_type: 'dimensions', image_data: imageData || selectedFp?.image_data });
      setAiResult({
        type: 'Room Dimensions',
        content: response.data.analysis || response.data.result || JSON.stringify(response.data, null, 2),
        model: response.data.model,
        processingTime: response.data.processingTimeMs
      });
      toast.success('Dimensions analysis completed!');
      setImageData(''); setSelectedFloorPlan(''); fetchData();
    } catch (error) {
      setAiResult({ type: 'Error', content: error.response?.data?.error || 'Analysis failed', error: true });
      toast.error('Analysis failed');
    } finally { setAnalyzing(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this analysis?')) return;
    try { await api.deleteFullAnalysis(id); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed to delete'); }
  };

  const filteredDimensions = dimensions.filter(d => d.floor_plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Room Dimensions</h1>
        <p className="text-gray-500 mt-1">AI-extracted room dimensions from floor plans</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Existing</label>
            <select value={selectedFloorPlan} onChange={(e) => { setSelectedFloorPlan(e.target.value); if (e.target.value) setImageData(''); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Select a floor plan</option>
              {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Image</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}>
              <input {...getInputProps()} />
              {imageData ? <span className="text-green-600 text-sm">Image uploaded</span> : <div className="flex items-center justify-center gap-2 text-gray-500"><Upload className="h-4 w-4" /><span className="text-sm">Drop image or click</span></div>}
            </div>
          </div>
          <button onClick={handleAnalyze} disabled={analyzing || (!selectedFloorPlan && !imageData)}
            className="py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</> : <><Ruler className="h-4 w-4" />Extract Dimensions</>}
          </button>
        </div>
      </div>

      {analyzing && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-16 w-16 text-green-600 animate-spin" />
            <p className="text-gray-600 font-medium">AI is extracting room dimensions...</p>
          </div>
        </div>
      )}

      {aiResult && !analyzing && (
        <div className={`bg-white rounded-xl shadow-sm p-6 border ${aiResult.error ? 'border-red-200' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{aiResult.type}</h3>
            {aiResult.model && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">{aiResult.model}</span>}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{aiResult.content}</div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search by floor plan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Floor Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDimensions.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  <Ruler className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>No dimension analyses yet</p>
                </td></tr>
              ) : filteredDimensions.map((dim) => (
                <tr key={dim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Ruler className="h-5 w-5 text-green-600" /></div><span className="font-medium text-gray-800">{dim.floor_plan_name}</span></div></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">{dim.model_used || 'AI'}</span></td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(dim.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">
                    <button onClick={() => setShowDetail(dim)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><Eye className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(dim.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Room Dimensions Analysis</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 prose prose-sm max-w-none whitespace-pre-wrap">{showDetail.full_result || 'No data'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
