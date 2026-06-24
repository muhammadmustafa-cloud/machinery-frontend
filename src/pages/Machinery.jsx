import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Settings2, Activity, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Machinery() {
  const [machines, setMachines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', code: '', location: '', status: 'Active' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMachines(data);
    } catch (err) {
      console.error('Failed to fetch machines');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const url = editingMachine 
        ? `${API_BASE_URL}/api/machines/${editingMachine._id}`
        : `${API_BASE_URL}/api/machines`;
      const method = editingMachine ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchMachines();
      } else {
        setErrorMsg(data.message || 'Error saving machine');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this machine?')) {
      await fetch(`${API_BASE_URL}/api/machines/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMachines();
    }
  };

  const openModal = (machine = null) => {
    setEditingMachine(machine);
    if (machine) {
      setFormData({ name: machine.name, code: machine.code, location: machine.location, status: machine.status });
    } else {
      setFormData({ name: '', code: '', location: '', status: 'Active' });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Machinery</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage factory machines and view their maintenance status.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Machine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map(machine => (
          <div key={machine._id} className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Settings2 className="h-6 w-6" />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openModal(machine)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(machine._id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{machine.name}</h3>
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">{machine.code}</p>

            <div className="mt-6 space-y-3 flex-1">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-2" />
                {machine.location || 'No location specified'}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Activity className="h-4 w-4 mr-2" />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  machine.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  machine.status === 'Under Maintenance' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {machine.status}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <button className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                View Maintenance Ledger
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingMachine ? 'Edit Machine' : 'Add New Machine'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Machine Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Machine Code / ID</label>
                <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">{isLoading ? 'Saving...' : 'Save Machine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
