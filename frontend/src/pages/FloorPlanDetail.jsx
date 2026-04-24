import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft, Brain, Loader2, Square, Lightbulb,
  Calculator, Maximize, RefreshCw, ScanSearch
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FloorPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [floorPlan, setFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    fetchFloorPlan();
  }, [id]);

  const fetchFloorPlan = async () => {
    try {
      const response = await api.getFloorPlan(id);
      setFloorPlan(response.data);
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (type) => {
    setAnalyzing(true);
    setAiResult(null);

    try {
      let response;
      if (type === 'detect_rooms') {
        response = await api.aiDetectRooms({ floor_plan_id: id, image_data: floorPlan.image_data });
      } else if (type === 'optimize') {
        response = await api.aiOptimize({ floor_plan_id: id });
      } else if (type === 'estimate') {
        response = await api.aiEstimate({ floor_plan_id: id });
      } else if (type === 'suggestions') {
        response = await api.aiSuggestions({ floor_plan_id: id, image_data: floorPlan.image_data });
      } else if (type === 'materials') {
        response = await api.aiMaterials({ floor_plan_id: id });
      } else {
        response = await api.aiAnalyze({ floor_plan_id: id, analysis_type: type, image_data: floorPlan.image_data });
      }

      setAiResult({
        type: type === 'full' ? 'Full Analysis' : type === 'detect_rooms' ? 'Room Detection' :
              type === 'optimize' ? 'Layout Optimization' : type === 'estimate' ? 'Cost Estimate' :
              type === 'suggestions' ? 'Suggestions' : type === 'materials' ? 'Materials' : 'Analysis',
        content: response.data.analysis || response.data.optimization || response.data.estimate || response.data.result || JSON.stringify(response.data, null, 2),
        model: response.data.model,
        processingTime: response.data.processingTimeMs
      });
      toast.success('Analysis completed!');
      fetchFloorPlan();
    } catch (error) {
      console.error('Error analyzing floor plan:', error);
      setAiResult({
        type: 'Error',
        content: error.response?.data?.error || 'An error occurred during analysis',
        error: true
      });
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!floorPlan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Floor plan not found</p>
        <button onClick={() => navigate('/floor-plans')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg mt-4">
          Back to Floor Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/floor-plans')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{floorPlan.name}</h1>
          <p className="text-gray-500">{floorPlan.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          {floorPlan.image_data && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <img src={floorPlan.image_data} alt={floorPlan.name} className="w-full rounded-lg" />
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              {['details', 'analysis'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Status</p><span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${floorPlan.status === 'analyzed' ? 'bg-green-100 text-green-700' : floorPlan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{floorPlan.status}</span></div>
                  <div><p className="text-sm text-gray-500">Total Area</p><p className="font-medium">{floorPlan.total_area || '-'} {floorPlan.unit}</p></div>
                  <div><p className="text-sm text-gray-500">Created</p><p className="font-medium">{new Date(floorPlan.created_at).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-500">Rooms</p><p className="font-medium">{floorPlan.rooms?.length || 0}</p></div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Analysis Options</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button onClick={() => handleAnalyze('full')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50">
                    <Brain className="h-6 w-6 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Full Analysis</span>
                  </button>
                  <button onClick={() => handleAnalyze('detect_rooms')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50">
                    <ScanSearch className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Detect Rooms</span>
                  </button>
                  <button onClick={() => handleAnalyze('suggestions')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50">
                    <Lightbulb className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">Suggestions</span>
                  </button>
                  <button onClick={() => handleAnalyze('materials')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50">
                    <RefreshCw className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Materials</span>
                  </button>
                  <button onClick={() => handleAnalyze('optimize')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
                    <Maximize className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Optimize</span>
                  </button>
                  <button onClick={() => handleAnalyze('estimate')} disabled={analyzing}
                    className="flex flex-col items-center gap-2 p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors disabled:opacity-50">
                    <Calculator className="h-6 w-6 text-pink-600" />
                    <span className="text-sm font-medium text-pink-700">Cost Estimate</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Result */}
          {analyzing && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <p className="text-gray-600 font-medium">Analyzing your floor plan...</p>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rooms */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Rooms ({floorPlan.rooms?.length || 0})</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {!floorPlan.rooms?.length ? (
                <p className="text-gray-500 text-center py-4">No rooms added</p>
              ) : (
                floorPlan.rooms.map((room) => (
                  <div key={room.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{room.name}</p>
                    <p className="text-sm text-gray-500">{room.width} x {room.length} ft ({room.area} sqft)</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Suggestions ({floorPlan.suggestions?.length || 0})</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {!floorPlan.suggestions?.length ? (
                <p className="text-gray-500 text-center py-4">No suggestions yet</p>
              ) : (
                floorPlan.suggestions.map((s) => (
                  <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{s.category}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${s.priority === 'high' ? 'bg-red-100 text-red-700' : s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{s.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
