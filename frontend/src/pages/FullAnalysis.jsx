import { useState, useEffect } from 'react';
import api from '../services/api';
import { Brain, Sparkles, Eye, Trash2, Loader2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FullAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.getFullAnalyses();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAnalyses(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    try {
      await api.deleteFullAnalysis(id);
      toast.success('Analysis deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredAnalyses = analyses.filter(a =>
    a.floor_plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Full Analysis</h1>
        <p className="text-gray-500 mt-1">Comprehensive AI-powered floor plan analyses</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search analyses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
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
              {filteredAnalyses.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No analyses yet</p>
                  <p className="text-sm mt-1">Run a full analysis from the AI Analysis page</p>
                </td></tr>
              ) : filteredAnalyses.map((analysis) => (
                <tr key={analysis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Brain className="h-5 w-5 text-indigo-600" /></div>
                      <span className="font-medium text-gray-800">{analysis.floor_plan_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">{analysis.model_used || 'AI'}</span></td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(analysis.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setShowDetail(analysis)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="h-5 w-5" /></button>
                      <button onClick={() => handleDelete(analysis.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Full Analysis Details</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">{showDetail.floor_plan_name}</h3>
                  <p className="text-sm text-gray-500">{showDetail.model_used}</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap border rounded-lg p-4 max-h-96 overflow-y-auto">
                {showDetail.full_result || showDetail.layout_analysis || 'No data'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
