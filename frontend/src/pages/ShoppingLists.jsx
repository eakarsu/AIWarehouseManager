import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingCart, Plus, X, Trash2, Check, Download, ExternalLink,
  ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const ShoppingLists = () => {
  const [searchParams] = useSearchParams();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', store: '', url: '', quantity: 1 });

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await api.getShoppingLists();
      const allLists = res.data.shoppingLists || res.data || [];
      setLists(allLists);

      // Auto-select list from URL param
      const listParam = searchParams.get('list');
      if (listParam) {
        const target = allLists.find(l => String(l.id) === listParam);
        if (target) setSelectedList(target);
      }
    } catch (err) {
      toast.error('Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateList = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createShoppingList({ name: newListName });
      toast.success('Shopping list created');
      const newList = res.data.shoppingList || res.data;
      setLists([newList, ...lists]);
      setSelectedList(newList);
      setShowCreate(false);
      setNewListName('');
    } catch (err) {
      toast.error('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (id) => {
    if (!window.confirm('Delete this shopping list?')) return;
    try {
      await api.deleteShoppingList(id);
      toast.success('List deleted');
      setLists(lists.filter(l => l.id !== id));
      if (selectedList?.id === id) setSelectedList(null);
    } catch (err) {
      toast.error('Failed to delete list');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedList) return;
    try {
      const res = await api.addShoppingListItem(selectedList.id, {
        ...newItem,
        price: newItem.price ? parseFloat(newItem.price) : undefined,
        quantity: parseInt(newItem.quantity) || 1
      });
      toast.success('Item added');
      const addedItem = res.data.item || res.data;
      const updatedList = {
        ...selectedList,
        items: [...(selectedList.items || []), addedItem]
      };
      setSelectedList(updatedList);
      setLists(lists.map(l => l.id === selectedList.id ? updatedList : l));
      setShowAddItem(false);
      setNewItem({ name: '', price: '', store: '', url: '', quantity: 1 });
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  const handleTogglePurchased = async (item) => {
    try {
      const updated = { ...item, purchased: !item.purchased };
      await api.updateShoppingListItem(item.id, { purchased: updated.purchased });
      const updatedItems = (selectedList.items || []).map(i => i.id === item.id ? updated : i);
      const updatedList = { ...selectedList, items: updatedItems };
      setSelectedList(updatedList);
      setLists(lists.map(l => l.id === selectedList.id ? updatedList : l));
    } catch (err) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.deleteShoppingListItem(itemId);
      const updatedItems = (selectedList.items || []).filter(i => i.id !== itemId);
      const updatedList = { ...selectedList, items: updatedItems };
      setSelectedList(updatedList);
      setLists(lists.map(l => l.id === selectedList.id ? updatedList : l));
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleExportPdf = async () => {
    if (!selectedList) return;
    try {
      toast.loading('Generating PDF...');
      const res = await api.exportShoppingListPdf(selectedList.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `shopping-list-${selectedList.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('PDF downloaded');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  const getListTotal = (list) => {
    return (list.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const getPurchasedTotal = (list) => {
    return (list.items || []).filter(i => i.purchased).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const getStoreBreakdown = (list) => {
    const stores = {};
    (list.items || []).forEach(item => {
      const store = item.store || 'Other';
      if (!stores[store]) stores[store] = 0;
      stores[store] += (item.price || 0) * (item.quantity || 1);
    });
    return stores;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Shopping Lists</h1>
          <p className="text-gray-600">Track furniture and materials purchases</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists sidebar */}
        <div className="space-y-2">
          {lists.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No shopping lists yet</p>
              <button onClick={() => setShowCreate(true)} className="text-primary-600 font-medium text-sm">
                Create your first list
              </button>
            </div>
          ) : (
            lists.map(list => (
              <div
                key={list.id}
                onClick={() => setSelectedList(list)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition ${
                  selectedList?.id === list.id
                    ? 'border-primary-300 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800">{list.name || list.title}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{(list.items || []).length} items</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-primary-600">
                    ${getListTotal(list).toFixed(2)}
                  </span>
                  {list.designId && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">From Design</span>
                  )}
                </div>
                {/* Progress bar */}
                {(list.items || []).length > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${((list.items || []).filter(i => i.purchased).length / (list.items || []).length) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {(list.items || []).filter(i => i.purchased).length} / {(list.items || []).length} purchased
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* List detail */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{selectedList.name || selectedList.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-100 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 border-b border-gray-100 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-800">${getListTotal(selectedList).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-600">Purchased</p>
                  <p className="text-lg font-bold text-green-700">${getPurchasedTotal(selectedList).toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-amber-600">Remaining</p>
                  <p className="text-lg font-bold text-amber-700">
                    ${(getListTotal(selectedList) - getPurchasedTotal(selectedList)).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Store breakdown */}
              {Object.keys(getStoreBreakdown(selectedList)).length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">By Store</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getStoreBreakdown(selectedList)).map(([store, total]) => (
                      <span key={store} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {store}: ${total.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="p-4">
                {(selectedList.items || []).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No items yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedList.items || []).map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                          item.purchased ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => handleTogglePurchased(item)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${
                            item.purchased
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-primary-500'
                          }`}
                        >
                          {item.purchased && <Check className="w-3 h-3" />}
                        </button>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {item.store && <span>{item.store}</span>}
                            {item.quantity > 1 && <span>x{item.quantity}</span>}
                          </div>
                        </div>
                        {item.price && (
                          <span className={`text-sm font-semibold whitespace-nowrap ${item.purchased ? 'text-gray-400' : 'text-primary-600'}`}>
                            ${(item.price * (item.quantity || 1)).toFixed(2)}
                          </span>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-primary-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Shopping List</h3>
              <p className="text-sm text-gray-500">Choose a list from the sidebar or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">New Shopping List</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Living Room Furniture"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Add Item</h2>
              <button onClick={() => setShowAddItem(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Sofa"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="499"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={1}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <input
                  type="text"
                  value={newItem.store}
                  onChange={(e) => setNewItem({ ...newItem, store: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="IKEA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Add Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingLists;
