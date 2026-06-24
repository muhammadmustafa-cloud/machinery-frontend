import React from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';

export default function Header() {
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300">
      
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg leading-5 bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
            placeholder="Search resources, orders..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        
        <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#09090b]" />
        </button>

        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-[2px] cursor-pointer">
          <div className="h-full w-full rounded-full border-2 border-white dark:border-[#09090b] overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
              alt="User avatar" 
              className="h-full w-full object-cover bg-blue-100 dark:bg-blue-900"
            />
          </div>
        </div>
      </div>

    </header>
  );
}
