import React, { useState } from 'react';
import {
  Sparkles, Palette, Sofa, Search, BookOpen, Layers, DollarSign,
  RotateCcw, Image, Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import * as api from '../services/api';

const tabs = [
  { id: 'generate-design', label: 'Generate Design', icon: Wand2, color: 'from-primary-500 to-secondary-500' },
  { id: 'generate-palette', label: 'Generate Palette', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { id: 'recommend-furniture', label: 'Recommend Furniture', icon: Sofa, color: 'from-amber-500 to-orange-500' },
  { id: 'analyze-room', label: 'Analyze Room', icon: Search, color: 'from-blue-500 to-cyan-500' },
  { id: 'style-guide', label: 'Style Guide', icon: BookOpen, color: 'from-purple-500 to-violet-500' },
  { id: 'match-style', label: 'Match Style', icon: Layers, color: 'from-teal-500 to-emerald-500' },
  { id: 'budget-planning', label: 'Budget Planning', icon: DollarSign, color: 'from-green-500 to-lime-500' },
  { id: 'visualize', label: 'Visualize Transformation', icon: RotateCcw, color: 'from-indigo-500 to-blue-500' },
  { id: 'generate-image', label: 'Generate Image', icon: Image, color: 'from-fuchsia-500 to-pink-500' },
];

const styles = [
  'Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern',
  'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse', 'Japanese Zen'
];
const roomTypes = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Home Office', 'Dining Room', 'Kids Room', 'Outdoor'
];
const moods = ['Calm', 'Energetic', 'Cozy', 'Elegant', 'Playful', 'Professional', 'Romantic', 'Natural'];

const AIDesignTools = () => {
  const [activeTab, setActiveTab] = useState('generate-design');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);

  // Form states
  const [designForm, setDesignForm] = useState({ style: '', roomType: '', requirements: '' });
  const [paletteForm, setPaletteForm] = useState({ style: '', mood: '', count: 5 });
  const [furnitureForm, setFurnitureForm] = useState({ roomType: '', style: '', budget: '' });
  const [analyzeForm, setAnalyzeForm] = useState({ description: '', dimensions: '' });
  const [styleGuideForm, setStyleGuideForm] = useState({ style: '', budget: '' });
  const [matchForm, setMatchForm] = useState({ preferences: '' });
  const [budgetForm, setBudgetForm] = useState({ roomType: '', budget: '', priorities: '' });
  const [visualizeForm, setVisualizeForm] = useState({ beforeDescription: '', desiredStyle: '' });
  const [imageForm, setImageForm] = useState({ prompt: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setGeneratedImage(null);

    try {
      let res;
      switch (activeTab) {
        case 'generate-design':
          res = await api.generateDesign(designForm);
          break;
        case 'generate-palette':
          res = await api.generatePalette(paletteForm);
          break;
        case 'recommend-furniture':
          res = await api.recommendFurniture({
            ...furnitureForm,
            budget: furnitureForm.budget ? parseFloat(furnitureForm.budget) : undefined
          });
          break;
        case 'analyze-room':
          res = await api.analyzeRoom(analyzeForm);
          break;
        case 'style-guide':
          res = await api.generateStyleGuide({
            ...styleGuideForm,
            budget: styleGuideForm.budget ? parseFloat(styleGuideForm.budget) : undefined
          });
          break;
        case 'match-style':
          res = await api.matchStyle(matchForm);
          break;
        case 'budget-planning':
          res = await api.planBudget({
            ...budgetForm,
            budget: budgetForm.budget ? parseFloat(budgetForm.budget) : undefined,
            priorities: budgetForm.priorities ? budgetForm.priorities.split(',').map(p => p.trim()) : []
          });
          break;
        case 'visualize':
          res = await api.visualizeTransformation(visualizeForm);
          break;
        case 'generate-image':
          res = await api.generateImage(imageForm);
          if (res.data.imageUrl) {
            setGeneratedImage(res.data.imageUrl);
          }
          break;
        default:
          break;
      }
      setResult(res.data);
      toast.success('AI generation completed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

    switch (activeTab) {
      case 'generate-design':
        return (
          <>
            <div>
              <label className={labelClass}>Style</label>
              <select value={designForm.style} onChange={(e) => setDesignForm({ ...designForm, style: e.target.value })} className={inputClass} required>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={designForm.roomType} onChange={(e) => setDesignForm({ ...designForm, roomType: e.target.value })} className={inputClass} required>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Requirements</label>
              <textarea value={designForm.requirements} onChange={(e) => setDesignForm({ ...designForm, requirements: e.target.value })} className={inputClass} placeholder="Describe any specific requirements..." rows={3} />
            </div>
          </>
        );
      case 'generate-palette':
        return (
          <>
            <div>
              <label className={labelClass}>Style</label>
              <select value={paletteForm.style} onChange={(e) => setPaletteForm({ ...paletteForm, style: e.target.value })} className={inputClass} required>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mood</label>
              <select value={paletteForm.mood} onChange={(e) => setPaletteForm({ ...paletteForm, mood: e.target.value })} className={inputClass}>
                <option value="">Select mood</option>
                {moods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Colors</label>
              <input type="number" min={3} max={10} value={paletteForm.count} onChange={(e) => setPaletteForm({ ...paletteForm, count: parseInt(e.target.value) })} className={inputClass} />
            </div>
          </>
        );
      case 'recommend-furniture':
        return (
          <>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={furnitureForm.roomType} onChange={(e) => setFurnitureForm({ ...furnitureForm, roomType: e.target.value })} className={inputClass} required>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={furnitureForm.style} onChange={(e) => setFurnitureForm({ ...furnitureForm, style: e.target.value })} className={inputClass}>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget ($)</label>
              <input type="number" value={furnitureForm.budget} onChange={(e) => setFurnitureForm({ ...furnitureForm, budget: e.target.value })} className={inputClass} placeholder="5000" />
            </div>
          </>
        );
      case 'analyze-room':
        return (
          <>
            <div>
              <label className={labelClass}>Room Description</label>
              <textarea value={analyzeForm.description} onChange={(e) => setAnalyzeForm({ ...analyzeForm, description: e.target.value })} className={inputClass} placeholder="Describe the current state of the room..." rows={4} required />
            </div>
            <div>
              <label className={labelClass}>Dimensions (e.g., 4m x 5m)</label>
              <input type="text" value={analyzeForm.dimensions} onChange={(e) => setAnalyzeForm({ ...analyzeForm, dimensions: e.target.value })} className={inputClass} placeholder="4m x 5m" />
            </div>
          </>
        );
      case 'style-guide':
        return (
          <>
            <div>
              <label className={labelClass}>Style</label>
              <select value={styleGuideForm.style} onChange={(e) => setStyleGuideForm({ ...styleGuideForm, style: e.target.value })} className={inputClass} required>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget ($)</label>
              <input type="number" value={styleGuideForm.budget} onChange={(e) => setStyleGuideForm({ ...styleGuideForm, budget: e.target.value })} className={inputClass} placeholder="10000" />
            </div>
          </>
        );
      case 'match-style':
        return (
          <div>
            <label className={labelClass}>Preferences</label>
            <textarea value={matchForm.preferences} onChange={(e) => setMatchForm({ ...matchForm, preferences: e.target.value })} className={inputClass} placeholder="Describe your style preferences, favorite colors, materials you like..." rows={5} required />
          </div>
        );
      case 'budget-planning':
        return (
          <>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={budgetForm.roomType} onChange={(e) => setBudgetForm({ ...budgetForm, roomType: e.target.value })} className={inputClass} required>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Budget ($)</label>
              <input type="number" value={budgetForm.budget} onChange={(e) => setBudgetForm({ ...budgetForm, budget: e.target.value })} className={inputClass} placeholder="15000" required />
            </div>
            <div>
              <label className={labelClass}>Priorities (comma-separated)</label>
              <input type="text" value={budgetForm.priorities} onChange={(e) => setBudgetForm({ ...budgetForm, priorities: e.target.value })} className={inputClass} placeholder="Comfort, Aesthetics, Durability" />
            </div>
          </>
        );
      case 'visualize':
        return (
          <>
            <div>
              <label className={labelClass}>Before Description</label>
              <textarea value={visualizeForm.beforeDescription} onChange={(e) => setVisualizeForm({ ...visualizeForm, beforeDescription: e.target.value })} className={inputClass} placeholder="Describe the current room state..." rows={3} required />
            </div>
            <div>
              <label className={labelClass}>Desired Style</label>
              <select value={visualizeForm.desiredStyle} onChange={(e) => setVisualizeForm({ ...visualizeForm, desiredStyle: e.target.value })} className={inputClass} required>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        );
      case 'generate-image':
        return (
          <div>
            <label className={labelClass}>Image Prompt</label>
            <textarea value={imageForm.prompt} onChange={(e) => setImageForm({ ...imageForm, prompt: e.target.value })} className={inputClass} placeholder="A modern minimalist living room with white walls, natural wood furniture, and large windows..." rows={4} required />
          </div>
        );
      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    const data = result.design || result.palette || result.recommendations ||
                 result.analysis || result.styleGuide || result.styleMatch ||
                 result.budgetPlan || result.transformation || result;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" /> AI Result
        </h3>

        {/* Generated Image */}
        {generatedImage && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <img src={generatedImage} alt="AI Generated" className="w-full h-64 object-cover" />
          </div>
        )}

        {/* Design Name / Title */}
        {(data.designName || data.paletteName || data.styleName || data.name || data.title) && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg mb-4">
            <h4 className="text-lg font-bold text-gray-800">
              {data.designName || data.paletteName || data.styleName || data.name || data.title}
            </h4>
            {(data.description || data.overview) && (
              <p className="text-sm text-gray-600 mt-1">{data.description || data.overview}</p>
            )}
          </div>
        )}

        {/* Color Palette */}
        {data.colorPalette && Array.isArray(data.colorPalette) && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Color Palette</h4>
            <div className="flex gap-2">
              {data.colorPalette.map((color, i) => (
                <div key={i} className="flex-1">
                  <div className="h-12 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: color }} />
                  <p className="text-xs text-gray-500 text-center mt-1">{color}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {data.colors && Array.isArray(data.colors) && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Colors</h4>
            <div className="space-y-2">
              {data.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: c.hex || c }} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{c.name || c.hex || c}</p>
                    {c.usage && <p className="text-xs text-gray-500">{c.usage}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Furniture Suggestions */}
        {(data.furnitureSuggestions || data.recommendations) && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">
              {data.furnitureSuggestions ? 'Furniture Suggestions' : 'Recommendations'}
            </h4>
            {data.totalEstimatedCost && (
              <p className="text-sm text-primary-600 font-semibold mb-2">
                Total Estimated: ${data.totalEstimatedCost.toLocaleString()}
              </p>
            )}
            <div className="space-y-2">
              {(data.furnitureSuggestions || data.recommendations).map((item, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                    {item.estimatedPrice && (
                      <span className="text-primary-600 font-semibold text-sm">${item.estimatedPrice.toLocaleString()}</span>
                    )}
                  </div>
                  {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {item.category && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>}
                    {item.material && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.material}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        {data.analysis && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Room Analysis</h4>
            {data.analysis.currentState && (
              <div className="bg-gray-50 p-3 rounded-lg mb-2">
                <p className="text-sm text-gray-700">{data.analysis.currentState}</p>
              </div>
            )}
            {data.analysis.strengths && (
              <div className="mb-2">
                <p className="text-xs font-medium text-green-700 mb-1">Strengths:</p>
                {data.analysis.strengths.map((s, i) => (
                  <p key={i} className="text-xs text-gray-600 ml-2">+ {s}</p>
                ))}
              </div>
            )}
            {data.analysis.weaknesses && (
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">Weaknesses:</p>
                {data.analysis.weaknesses.map((w, i) => (
                  <p key={i} className="text-xs text-gray-600 ml-2">- {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Improvements */}
        {data.improvements && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Improvements</h4>
            <div className="space-y-2">
              {data.improvements.map((imp, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 text-sm">{imp.area}</span>
                    {imp.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        imp.priority === 'high' ? 'bg-red-100 text-red-700' :
                        imp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{imp.priority}</span>
                    )}
                  </div>
                  {imp.suggestion && <p className="text-xs text-gray-600 mt-1">{imp.suggestion}</p>}
                  {imp.estimatedCost && <p className="text-xs text-primary-600 mt-1">{imp.estimatedCost}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Elements */}
        {data.keyElements && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Key Elements</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.keyElements.map((el, i) => (
                <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{el}</span>
              ))}
            </div>
          </div>
        )}

        {/* Do and Don't */}
        {data.doAndDont && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-semibold text-green-800 text-xs mb-1">Do</h4>
              {data.doAndDont.do?.map((d, i) => (
                <p key={i} className="text-xs text-green-700">+ {d}</p>
              ))}
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="font-semibold text-red-800 text-xs mb-1">Don't</h4>
              {data.doAndDont.dont?.map((d, i) => (
                <p key={i} className="text-xs text-red-700">- {d}</p>
              ))}
            </div>
          </div>
        )}

        {/* Budget Breakdown */}
        {data.breakdown && Array.isArray(data.breakdown) && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Budget Breakdown</h4>
            <div className="space-y-2">
              {data.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">{item.category || item.name}</span>
                  <span className="text-sm font-semibold text-primary-600">
                    ${(item.amount || item.cost || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Tips */}
        {data.layoutTips && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Layout Tips</h4>
            <ul className="space-y-1">
              {data.layoutTips.map((tip, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="text-primary-500 font-bold">{i + 1}.</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Material Recommendations */}
        {data.materialRecommendations && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Materials</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.materialRecommendations.map((m, i) => (
                <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                  {typeof m === 'string' ? m : m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Markdown content fallback */}
        {typeof data === 'string' && (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{data}</ReactMarkdown>
          </div>
        )}

        {/* AI text response */}
        {data.response && typeof data.response === 'string' && (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{data.response}</ReactMarkdown>
          </div>
        )}

        {data.text && typeof data.text === 'string' && (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{data.text}</ReactMarkdown>
          </div>
        )}

        {/* Quick Wins */}
        {data.quickWins && (
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <h4 className="font-semibold text-green-800 text-sm mb-1">Quick Wins</h4>
            {data.quickWins.map((w, i) => (
              <p key={i} className="text-xs text-green-700">&#x2713; {w}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Design Tools</h1>
        <p className="text-gray-600">Leverage AI to generate designs, palettes, furniture recommendations, and more</p>
      </div>

      {/* Tab Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); setGeneratedImage(null); }}
            className={`p-4 rounded-xl border transition text-left ${
              activeTab === tab.id
                ? 'border-primary-300 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary-200 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center mb-2`}>
              <tab.icon className="w-5 h-5 text-white" />
            </div>
            <p className={`text-sm font-medium ${activeTab === tab.id ? 'text-primary-700' : 'text-gray-700'}`}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {tabs.find(t => t.id === activeTab)?.icon &&
              React.createElement(tabs.find(t => t.id === activeTab).icon, { className: 'w-5 h-5 text-primary-500' })
            }
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderForm()}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">AI is working its magic...</p>
              <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
            </div>
          )}
          {!loading && result && renderResult()}
          {!loading && !result && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Generate</h3>
              <p className="text-sm text-gray-500">Fill in the form and click Generate to see AI-powered results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDesignTools;
