import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, ArrowDownToLine, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [itemForm, setItemForm] = useState({ name: '', sku: '', description: '', unit: 'pcs', minStockAlert: 5 });
  const [stockForm, setStockForm] = useState({ item: '', quantity: '', price: '', supplier: '', remarks: '' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (err) {
      console.error('Failed to fetch items');
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const url = editingItem 
        ? `http://localhost:5000/api/items/${editingItem._id}`
        : 'http://localhost:5000/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(itemForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsItemModalOpen(false);
        fetchItems();
      } else {
        setErrorMsg(data.message || 'Error saving item');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/ledger/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(stockForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsStockModalOpen(false);
        fetchItems();
      } else {
        setErrorMsg(data.message || 'Error adding stock');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await fetch(`http://localhost:5000/api/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchItems();
    }
  };

  const openItemModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setItemForm({ name: item.name, sku: item.sku, description: item.description, unit: item.unit, minStockAlert: item.minStockAlert });
    } else {
      setItemForm({ name: '', sku: '', description: '', unit: 'pcs', minStockAlert: 5 });
    }
    setErrorMsg('');
    setIsItemModalOpen(true);
  };

  const openStockModal = (item) => {
    setStockForm({ item: item._id, quantity: '', price: '', supplier: '', remarks: '' });
    setErrorMsg('');
    setIsStockModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Inventory Items</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage spare parts, raw materials, and stock levels.</p>
        </div>
        <button 
          onClick={() => openItemModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </button>
      </div>

      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-3">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">{item.sku}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white mr-2">{item.currentStock} {item.unit}</span>
                      {item.currentStock <= item.minStockAlert && (
                        <span className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full font-medium">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openStockModal(item)} className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg">
                      <ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Add Stock
                    </button>
                    <button onClick={() => openItemModal(item)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteItem(item._id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            </div>
            <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
                  <input type="text" required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU Code</label>
                  <input type="text" required value={itemForm.sku} onChange={e => setItemForm({...itemForm, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit (e.g. pcs, kg)</label>
                  <input type="text" required value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="2"></textarea>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Alert Threshold</label>
                  <input type="number" required min="0" value={itemForm.minStockAlert} onChange={e => setItemForm({...itemForm, minStockAlert: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">{isLoading ? 'Saving...' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-900/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase / Add Stock</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add newly purchased inventory to the ledger.</p>
            </div>
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <input type="number" required step="0.01" min="0.01" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Price / Cost</label>
                  <input type="number" required min="0" step="0.01" value={stockForm.price} onChange={e => setStockForm({...stockForm, price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
                  <input type="text" value={stockForm.supplier} onChange={e => setStockForm({...stockForm, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remarks / Invoice #</label>
                  <input type="text" value={stockForm.remarks} onChange={e => setStockForm({...stockForm, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">{isLoading ? 'Processing...' : 'Confirm Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
