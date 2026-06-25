import React from 'react';
import { LayoutDashboard, Users, Settings, Package, FileText, Settings2, LogOut, Briefcase, CalendarDays } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: CalendarDays, label: 'Daily Stock', path: '/dashboard/daily-stock' },
    { icon: Briefcase, label: 'Suppliers', path: '/dashboard/suppliers' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: Settings2, label: 'Machinery', path: '/dashboard/machinery' },
    { icon: FileText, label: 'Transaction', path: '/dashboard/ledger' },
    { icon: Users, label: 'Users', path: '/dashboard/users' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/signout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      localStorage.removeItem('userInfo');
      navigate('/signin');
    }
  };

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#09090b] border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Machinery Mill</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <button 
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
