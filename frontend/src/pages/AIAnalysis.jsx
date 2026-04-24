import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import {
  Brain, Upload, Loader2, History, FileImage, Clock,
  Cpu, Sparkles, BarChart3, Maximize, Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';

const analysisTypes = [
  { id: 'full', name: 'Full Analysis', icon: Brain, description: 'Comprehensive floor plan analysis', color: 'indigo' },
  { id: 'dimensions', name: 'Dimensions', icon: BarChart3, description: 'Extract room dimensions', color: 'green' },
  { id: 'suggestions', name: 'Suggestions', icon: Sparkles, description: 'Renovation recommendations', color: 'yellow' },
  { id: 'materials', name: 'Materials', icon: FileImage, description: 'Material recommendations', color: 'orange' },
  { id: 'optimize', name: 'Optimize Layout', icon: Maximize, description: 'Space optimization analysis', color: 'purple' },
  { id: 'estimate', name: 'Cost Estimate', icon: Calculator, description: 'Project cost estimation', color: 'pink' },
];

export default function AIAnalysis() {
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState('');
  const [selectedType, setSelectedType] = useState('full');
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fpRes, histRes] = await Promise.all([
        api.getFloorPlans(),
        api.getFullAnalyses().catch(() => ({ data: [] }))
      ]);
      const fpData = Array.isArray(fpRes.data) ? fpRes.data : (fpRes.data?.data || []);
      setFloorPlans(fpData);
      const histData = Array.isArray(histRes.data) ? histRes.data : (histRes.data?.data || []);
      setHistory(histData);
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
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            setImageData(canvas.toDataURL('image/png'));
          } catch { setImageData(dataUrl); }
        };
        img.onerror = () => setImageData(dataUrl);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }, maxFiles: 1
  });

  const handleAnalyze = async () => {
    if (!selectedFloorPlan && !imageData) {
      toast.error('Please select a floor plan or upload an image');
      return;
    }

    setAnalyzing(true);
    setAiResult(null);

    try {
      let response;
      const typeInfo = analysisTypes.find(t => t.id === selectedType);
      const selectedFp = floorPlans.find(fp => fp.id == selectedFloorPlan);

      if (selectedType === 'optimize') {
        response = await api.aiOptimize({ floor_plan_id: selectedFloorPlan || undefined, image_data: imageData || selectedFp?.image_data });
      } else if (selectedType === 'estimate') {
        response = await api.aiEstimate({ floor_plan_id: selectedFloorPlan || undefined, image_data: imageData || selectedFp?.image_data });
      } else {
        response = await api.aiAnalyze({
          floor_plan_id: selectedFloorPlan || undefined,
          analysis_type: selectedType,
          image_data: imageData || selectedFp?.image_data
        });
      }

      setAiResult({
        type: typeInfo.name,
        content: response.data.analysis || response.data.optimization || response.data.estimate || response.data.result || JSON.stringify(response.data, null, 2),
        model: response.data.model,
        processingTime: response.data.processingTimeMs
      });
      toast.success('Analysis completed!');
      fetchData();
    } catch (error) {
      setAiResult({
        type: 'Error',
        content: error.response?.data?.error || 'An error occurred during analysis',
        error: true
      });
      toast.error(error.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">AI Analysis</h1>
        <p className="text-gray-500 mt-1">Analyze floor plans using AI-powered insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Floor Plan Selection or Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select or Upload Floor Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Existing</label>
                <select value={selectedFloorPlan} onChange={(e) => { setSelectedFloorPlan(e.target.value); if (e.target.value) setImageData(''); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a floor plan</option>
                  {floorPlans.map(fp => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload New</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                  <input {...getInputProps()} />
                  {imageData ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileImage className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">Image uploaded</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Upload className="h-5 w-5" /><span>Drop image or click</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {imageData && <img src={imageData} alt="Uploaded" className="max-h-48 mx-auto rounded-lg mt-4" />}
          </div>

          {/* Analysis Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Analysis Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {analysisTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button key={type.id} onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${isSelected ? `bg-${type.color}-100 border-${type.color}-500 text-${type.color}-700` : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700'}`}>{type.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analyze Button */}
          <button onClick={handleAnalyze} disabled={analyzing || (!selectedFloorPlan && !imageData)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {analyzing ? (<><Loader2 className="h-5 w-5 animate-spin" />Analyzing...</>) : (<><Brain className="h-5 w-5" />Run AI Analysis</>)}
          </button>

          {/* AI Result */}
          {analyzing && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                <p className="text-gray-600 font-medium">AI is analyzing your floor plan...</p>
                <p className="text-sm text-gray-400">This may take a moment</p>
              </div>
            </div>
          )}

          {aiResult && !analyzing && (
            <div className={`bg-white rounded-xl shadow-sm p-6 border ${aiResult.error ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{aiResult.type}</h3>
                {aiResult.model && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">{aiResult.model}</span>}
              </div>
              {aiResult.processingTime && <p className="text-sm text-gray-400 mb-4">Completed in {(aiResult.processingTime / 1000).toFixed(1)}s</p>}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{aiResult.content}</div>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Recent Analyses</h2>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No analysis history yet</p>
              ) : (
                history.slice(0, 10).map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{item.floor_plan_name || 'Analysis'}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.analysis_type || 'Full'} Analysis</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.processing_time_ms && <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{(item.processing_time_ms / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-gray-800 mb-3">Analysis Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-indigo-500">-</span>Upload high-resolution floor plans for better results</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">-</span>Use "Full Analysis" for comprehensive insights</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">-</span>"Optimize Layout" works best with existing floor plans</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500">-</span>Cost estimates require floor plan room data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
