import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const url = editingSupplier 
        ? `${API_BASE_URL}/api/suppliers/${editingSupplier._id}`
        : `${API_BASE_URL}/api/suppliers`;
        
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      
      closeModal();
      fetchSuppliers();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSuppliers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '' });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your vendors and suppliers.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Added On</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {suppliers.map((supplier) => (
                <tr key={supplier._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(supplier.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => openModal(supplier)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(supplier._id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No suppliers found. Click "Add Supplier" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="e.g. Ahmed Traders"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingSupplier ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
