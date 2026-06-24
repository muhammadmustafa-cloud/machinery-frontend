import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Shield, User as UserIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const url = editingUser 
        ? `${API_BASE_URL}/api/users/${editingUser._id}`
        : `${API_BASE_URL}/api/users`;
        
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (editingUser) delete payload.password; // Dont send password on update for now

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setErrorMsg(data.message || 'Error saving user');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (err) {
        console.error('Failed to delete user');
      }
    }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage system users and their access roles.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-3">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300'
                    }`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(user)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mr-3 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errorMsg}</div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input 
                    type="email" required
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input 
                    type="password" required
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
