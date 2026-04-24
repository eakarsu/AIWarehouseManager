import React, { useState, useEffect } from 'react';
import { Box, Search, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const res = await api.getMaterials(params);
      setMaterials(res.data.materials || res.data || []);
    } catch (err) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getMaterialCategories();
        setCategories(res.data.categories || res.data || []);
      } catch { /* optional */ }
    };
    fetchCategories();
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [filterCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const getStockColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in stock': case 'available': return 'bg-green-100 text-green-700';
      case 'low stock': case 'limited': return 'bg-yellow-100 text-yellow-700';
      case 'out of stock': case 'unavailable': return 'bg-red-100 text-red-700';
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

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Materials Library</h1>
        <p className="text-gray-600">Browse materials, textures, and finishes for your designs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={typeof c === 'string' ? c : c.id} value={typeof c === 'string' ? c : c.name}>
              {typeof c === 'string' ? c : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="text-center py-16">
          <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No materials found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials.map(material => (
            <div
              key={material.id}
              onClick={() => setSelectedMaterial(material)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                {material.imageUrl || material.thumbnail || material.textureUrl ? (
                  <img
                    src={material.imageUrl || material.thumbnail || material.textureUrl}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Box className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {material.stockStatus && (
                  <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${getStockColor(material.stockStatus)}`}>
                    {material.stockStatus}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{material.name}</h3>
                {material.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{material.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {material.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{material.category}</span>
                    )}
                  </div>
                  {material.price !== undefined && (
                    <span className="font-semibold text-primary-600 text-sm">${material.price?.toFixed(2)}</span>
                  )}
                </div>
                {material.supplier && (
                  <p className="text-xs text-gray-400 mt-1">{material.supplier}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{selectedMaterial.name}</h2>
              <button onClick={() => setSelectedMaterial(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(selectedMaterial.imageUrl || selectedMaterial.thumbnail || selectedMaterial.textureUrl) && (
                <img
                  src={selectedMaterial.imageUrl || selectedMaterial.thumbnail || selectedMaterial.textureUrl}
                  alt={selectedMaterial.name}
                  className="w-full h-56 object-cover rounded-lg mb-4"
                />
              )}

              {selectedMaterial.description && (
                <p className="text-gray-600 mb-4">{selectedMaterial.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedMaterial.category && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="font-medium text-gray-800">{selectedMaterial.category}</p>
                  </div>
                )}
                {selectedMaterial.price !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-primary-600">${selectedMaterial.price?.toFixed(2)}</p>
                  </div>
                )}
                {selectedMaterial.supplier && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="font-medium text-gray-800">{selectedMaterial.supplier}</p>
                  </div>
                )}
                {selectedMaterial.stockStatus && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Stock Status</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStockColor(selectedMaterial.stockStatus)}`}>
                      {selectedMaterial.stockStatus}
                    </span>
                  </div>
                )}
                {selectedMaterial.material && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Material Type</p>
                    <p className="font-medium text-gray-800">{selectedMaterial.material}</p>
                  </div>
                )}
                {selectedMaterial.finish && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Finish</p>
                    <p className="font-medium text-gray-800">{selectedMaterial.finish}</p>
                  </div>
                )}
                {selectedMaterial.dimensions && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Dimensions</p>
                    <p className="font-medium text-gray-800">{selectedMaterial.dimensions}</p>
                  </div>
                )}
                {selectedMaterial.color && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Color</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: selectedMaterial.color }} />
                      <p className="font-medium text-gray-800">{selectedMaterial.color}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedMaterial.properties && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Properties</h4>
                  <p className="text-sm text-gray-600">{
                    typeof selectedMaterial.properties === 'string'
                      ? selectedMaterial.properties
                      : JSON.stringify(selectedMaterial.properties, null, 2)
                  }</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
