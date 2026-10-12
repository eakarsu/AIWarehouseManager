
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import {
  Sparkles, Palette, Sofa, Search, BookOpen, Layers, DollarSign,
  RotateCcw, Image, Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AIReport from '../components/AIReport';
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
  const fullAIExamples = useFullAIExamples();

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
              <select value={designForm.style} onChange={(e) => setDesignForm({ ...designForm, style: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: designForm.style, change: (e) => setDesignForm({ ...designForm, style: e.target.value }), label: "designForm.style", manual: false, json: false, sample: '' }, "p1-5079", undefined)}>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={designForm.roomType} onChange={(e) => setDesignForm({ ...designForm, roomType: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: designForm.roomType, change: (e) => setDesignForm({ ...designForm, roomType: e.target.value }), label: "designForm.roomType", manual: false, json: false, sample: '' }, "p1-5485", undefined)}>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Requirements</label>
              <textarea value={designForm.requirements} onChange={(e) => setDesignForm({ ...designForm, requirements: e.target.value })} className={inputClass} placeholder="Describe any specific requirements..." rows={3} data-full-ai-field={fullAIExamples.bind({ current: designForm.requirements, change: (e) => setDesignForm({ ...designForm, requirements: e.target.value }), label: "designForm.requirements", manual: false, json: false, sample: '' }, "p1-5907", undefined)} />
            </div>
          </>
        );
      case 'generate-palette':
        return (
          <>
            <div>
              <label className={labelClass}>Style</label>
              <select value={paletteForm.style} onChange={(e) => setPaletteForm({ ...paletteForm, style: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: paletteForm.style, change: (e) => setPaletteForm({ ...paletteForm, style: e.target.value }), label: "paletteForm.style", manual: false, json: false, sample: '' }, "p1-6312", undefined)}>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mood</label>
              <select value={paletteForm.mood} onChange={(e) => setPaletteForm({ ...paletteForm, mood: e.target.value })} className={inputClass} data-full-ai-field={fullAIExamples.bind({ current: paletteForm.mood, change: (e) => setPaletteForm({ ...paletteForm, mood: e.target.value }), label: "paletteForm.mood", manual: false, json: false, sample: '' }, "p1-6716", undefined)}>
                <option value="">Select mood</option>
                {moods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Colors</label>
              <input type="number" min={3} max={10} value={paletteForm.count} onChange={(e) => setPaletteForm({ ...paletteForm, count: parseInt(e.target.value) })} className={inputClass} data-full-ai-field={fullAIExamples.bind({ current: paletteForm.count, change: (e) => setPaletteForm({ ...paletteForm, count: parseInt(e.target.value) }), label: "paletteForm.count", manual: false, json: false, sample: 5 }, "p1-7119", undefined)} />
            </div>
          </>
        );
      case 'recommend-furniture':
        return (
          <>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={furnitureForm.roomType} onChange={(e) => setFurnitureForm({ ...furnitureForm, roomType: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: furnitureForm.roomType, change: (e) => setFurnitureForm({ ...furnitureForm, roomType: e.target.value }), label: "furnitureForm.roomType", manual: false, json: false, sample: '' }, "p1-7497", undefined)}>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={furnitureForm.style} onChange={(e) => setFurnitureForm({ ...furnitureForm, style: e.target.value })} className={inputClass} data-full-ai-field={fullAIExamples.bind({ current: furnitureForm.style, change: (e) => setFurnitureForm({ ...furnitureForm, style: e.target.value }), label: "furnitureForm.style", manual: false, json: false, sample: '' }, "p1-7921", undefined)}>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget ($)</label>
              <input type="number" value={furnitureForm.budget} onChange={(e) => setFurnitureForm({ ...furnitureForm, budget: e.target.value })} className={inputClass} placeholder="5000" data-full-ai-field={fullAIExamples.bind({ current: furnitureForm.budget, change: (e) => setFurnitureForm({ ...furnitureForm, budget: e.target.value }), label: "furnitureForm.budget", manual: false, json: false, sample: '' }, "p1-8328", undefined)} />
            </div>
          </>
        );
      case 'analyze-room':
        return (
          <>
            <div>
              <label className={labelClass}>Room Description</label>
              <textarea value={analyzeForm.description} onChange={(e) => setAnalyzeForm({ ...analyzeForm, description: e.target.value })} className={inputClass} placeholder="Describe the current state of the room..." rows={4} required data-full-ai-field={fullAIExamples.bind({ current: analyzeForm.description, change: (e) => setAnalyzeForm({ ...analyzeForm, description: e.target.value }), label: "analyzeForm.description", manual: false, json: false, sample: '' }, "p1-8706", undefined)} />
            </div>
            <div>
              <label className={labelClass}>Dimensions (e.g., 4m x 5m)</label>
              <input type="text" value={analyzeForm.dimensions} onChange={(e) => setAnalyzeForm({ ...analyzeForm, dimensions: e.target.value })} className={inputClass} placeholder="4m x 5m" data-full-ai-field={fullAIExamples.bind({ current: analyzeForm.dimensions, change: (e) => setAnalyzeForm({ ...analyzeForm, dimensions: e.target.value }), label: "analyzeForm.dimensions", manual: false, json: false, sample: '' }, "p1-9060", undefined)} />
            </div>
          </>
        );
      case 'style-guide':
        return (
          <>
            <div>
              <label className={labelClass}>Style</label>
              <select value={styleGuideForm.style} onChange={(e) => setStyleGuideForm({ ...styleGuideForm, style: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: styleGuideForm.style, change: (e) => setStyleGuideForm({ ...styleGuideForm, style: e.target.value }), label: "styleGuideForm.style", manual: false, json: false, sample: '' }, "p1-9429", undefined)}>
                <option value="">Select style</option>
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget ($)</label>
              <input type="number" value={styleGuideForm.budget} onChange={(e) => setStyleGuideForm({ ...styleGuideForm, budget: e.target.value })} className={inputClass} placeholder="10000" data-full-ai-field={fullAIExamples.bind({ current: styleGuideForm.budget, change: (e) => setStyleGuideForm({ ...styleGuideForm, budget: e.target.value }), label: "styleGuideForm.budget", manual: false, json: false, sample: '' }, "p1-9848", undefined)} />
            </div>
          </>
        );
      case 'match-style':
        return (
          <div>
            <label className={labelClass}>Preferences</label>
            <textarea value={matchForm.preferences} onChange={(e) => setMatchForm({ ...matchForm, preferences: e.target.value })} className={inputClass} placeholder="Describe your style preferences, favorite colors, materials you like..." rows={5} required data-full-ai-field={fullAIExamples.bind({ current: matchForm.preferences, change: (e) => setMatchForm({ ...matchForm, preferences: e.target.value }), label: "matchForm.preferences", manual: false, json: false, sample: '' }, "p1-10205", undefined)} />
          </div>
        );
      case 'budget-planning':
        return (
          <>
            <div>
              <label className={labelClass}>Room Type</label>
              <select value={budgetForm.roomType} onChange={(e) => setBudgetForm({ ...budgetForm, roomType: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: budgetForm.roomType, change: (e) => setBudgetForm({ ...budgetForm, roomType: e.target.value }), label: "budgetForm.roomType", manual: false, json: false, sample: '' }, "p1-10635", undefined)}>
                <option value="">Select room type</option>
                {roomTypes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Budget ($)</label>
              <input type="number" value={budgetForm.budget} onChange={(e) => setBudgetForm({ ...budgetForm, budget: e.target.value })} className={inputClass} placeholder="15000" required data-full-ai-field={fullAIExamples.bind({ current: budgetForm.budget, change: (e) => setBudgetForm({ ...budgetForm, budget: e.target.value }), label: "budgetForm.budget", manual: false, json: false, sample: '' }, "p1-11061", undefined)} />
            </div>
            <div>
              <label className={labelClass}>Priorities (comma-separated)</label>
              <input type="text" value={budgetForm.priorities} onChange={(e) => setBudgetForm({ ...budgetForm, priorities: e.target.value })} className={inputClass} placeholder="Comfort, Aesthetics, Durability" data-full-ai-field={fullAIExamples.bind({ current: budgetForm.priorities, change: (e) => setBudgetForm({ ...budgetForm, priorities: e.target.value }), label: "budgetForm.priorities", manual: false, json: false, sample: '' }, "p1-11370", undefined)} />
            </div>
          </>
        );
      case 'visualize':
        return (
          <>
            <div>
              <label className={labelClass}>Before Description</label>
              <textarea value={visualizeForm.beforeDescription} onChange={(e) => setVisualizeForm({ ...visualizeForm, beforeDescription: e.target.value })} className={inputClass} placeholder="Describe the current room state..." rows={3} required data-full-ai-field={fullAIExamples.bind({ current: visualizeForm.beforeDescription, change: (e) => setVisualizeForm({ ...visualizeForm, beforeDescription: e.target.value }), label: "visualizeForm.beforeDescription", manual: false, json: false, sample: '' }, "p1-11771", undefined)} />
            </div>
            <div>
              <label className={labelClass}>Desired Style</label>
              <select value={visualizeForm.desiredStyle} onChange={(e) => setVisualizeForm({ ...visualizeForm, desiredStyle: e.target.value })} className={inputClass} required data-full-ai-field={fullAIExamples.bind({ current: visualizeForm.desiredStyle, change: (e) => setVisualizeForm({ ...visualizeForm, desiredStyle: e.target.value }), label: "visualizeForm.desiredStyle", manual: false, json: false, sample: '' }, "p1-12123", undefined)}>
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
            <textarea value={imageForm.prompt} onChange={(e) => setImageForm({ ...imageForm, prompt: e.target.value })} className={inputClass} placeholder="A modern minimalist living room with white walls, natural wood furniture, and large windows..." rows={4} required data-full-ai-field={fullAIExamples.bind({ current: imageForm.prompt, change: (e) => setImageForm({ ...imageForm, prompt: e.target.value }), label: "imageForm.prompt", manual: false, json: false, sample: '' }, "p1-12620", undefined)} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderResult = () => result && (
    <>
      {generatedImage && <img src={generatedImage} alt="AI Generated" className="w-full h-64 object-cover rounded-lg" />}
      <AIReport response={result} title={tabs.find(tab => tab.id === activeTab)?.label || 'AI result'} />
    </>
  );

  return (
    <div className="animate-fadeIn" data-full-ai-workspace="AIDesignTools"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
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
