import React, { useState, useEffect } from 'react';
import {
  Sofa, Search, ExternalLink, ShoppingCart, Camera, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const styleOptions = [
  'Modern Minimalist', 'Scandinavian', 'Industrial', 'Mid-Century Modern',
  'Bohemian', 'Contemporary', 'Traditional', 'Coastal', 'Farmhouse'
];

const FurnitureCatalog = () => {
  const [furniture, setFurniture] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [addingToList, setAddingToList] = useState(null);
  const [shoppingLists, setShoppingLists] = useState([]);

  const fetchFurniture = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStyle) params.style = filterStyle;
      if (priceMin) params.priceMin = parseFloat(priceMin);
      if (priceMax) params.priceMax = parseFloat(priceMax);
      const res = await api.getFurniture(params);
      setFurniture(res.data.furniture || res.data || []);
    } catch (err) {
      toast.error('Failed to load furniture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getFurnitureCategories();
        setCategories(res.data.categories || res.data || []);
      } catch {
        /* categories are optional */
      }
    };
    fetchCategories();
    fetchFurniture();
  }, []);

  useEffect(() => {
    fetchFurniture();
  }, [filterCategory, filterStyle]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFurniture();
  };

  const handlePriceFilter = () => {
    fetchFurniture();
  };

  const handleAddToList = async (item) => {
    try {
      const res = await api.getShoppingLists();
      setShoppingLists(res.data.shoppingLists || res.data || []);
      setAddingToList(item);
    } catch (err) {
      toast.error('Failed to load shopping lists');
    }
  };

  const addItemToList = async (listId) => {
    try {
      await api.addShoppingListItem(listId, {
        name: addingToList.name,
        price: addingToList.price,
        store: addingToList.store || addingToList.supplier,
        url: addingToList.url || addingToList.storeUrl,
        imageUrl: addingToList.imageUrl || addingToList.thumbnail,
        category: addingToList.category,
        furnitureId: addingToList.id
      });
      toast.success(`Added "${addingToList.name}" to shopping list`);
      setAddingToList(null);
    } catch (err) {
      toast.error('Failed to add item to list');
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Furniture Catalog</h1>
        <p className="text-gray-600">Browse and discover furniture for your designs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search furniture..."
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
          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Styles</option>
            {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min $"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max $"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handlePriceFilter}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Furniture Grid */}
      {furniture.length === 0 ? (
        <div className="text-center py-16">
          <Sofa className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No furniture found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {furniture.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              <div
                className="aspect-square relative overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.imageUrl || item.thumbnail ? (
                  <img
                    src={item.imageUrl || item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Sofa className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {item.arReady && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Camera className="w-3 h-3" /> AR
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
                  )}
                  {item.style && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{item.style}</span>
                  )}
                </div>
                {item.price !== undefined && (
                  <p className="font-bold text-primary-600 text-lg mb-3">${item.price?.toFixed(2)}</p>
                )}
                <div className="flex gap-2">
                  {(item.url || item.storeUrl) && (
                    <a
                      href={item.url || item.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" /> Store
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToList(item); }}
                    className="flex-1 bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="w-3 h-3" /> Add to List
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(selectedItem.imageUrl || selectedItem.thumbnail) && (
                <img src={selectedItem.imageUrl || selectedItem.thumbnail} alt={selectedItem.name} className="w-full h-64 object-cover rounded-lg mb-4" />
              )}
              {selectedItem.description && <p className="text-gray-600 mb-4">{selectedItem.description}</p>}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedItem.price !== undefined && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-primary-600">${selectedItem.price?.toFixed(2)}</p>
                  </div>
                )}
                {selectedItem.category && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="font-medium text-gray-800">{selectedItem.category}</p>
                  </div>
                )}
                {selectedItem.style && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Style</p>
                    <p className="font-medium text-gray-800">{selectedItem.style}</p>
                  </div>
                )}
                {selectedItem.material && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="font-medium text-gray-800">{selectedItem.material}</p>
                  </div>
                )}
                {selectedItem.dimensions && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Dimensions</p>
                    <p className="font-medium text-gray-800">{selectedItem.dimensions}</p>
                  </div>
                )}
                {selectedItem.store && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Store</p>
                    <p className="font-medium text-gray-800">{selectedItem.store}</p>
                  </div>
                )}
              </div>
              {selectedItem.arReady && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">AR Ready - View in your space</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { handleAddToList(selectedItem); setSelectedItem(null); }}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Shopping List
                </button>
                {(selectedItem.url || selectedItem.storeUrl) && (
                  <a
                    href={selectedItem.url || selectedItem.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Visit Store
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to List Modal */}
      {addingToList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Add to Shopping List</h2>
              <button onClick={() => setAddingToList(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">Select a list for "{addingToList.name}":</p>
              {shoppingLists.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No shopping lists yet. Create one first.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {shoppingLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => addItemToList(list.id)}
                      className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition"
                    >
                      <p className="font-medium">{list.name || list.title}</p>
                      <p className="text-xs text-gray-500">{list.items?.length || 0} items</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FurnitureCatalog;
