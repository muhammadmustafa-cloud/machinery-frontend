import React from 'react';
import { TrendingUp, Users, PackageOpen, AlertCircle } from 'lucide-react';

function StatCard({ title, value, change, icon: Icon, positive }) {
  return (
    <div className="bg-white dark:bg-[#09090b] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="flex items-baseline space-x-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h2>
        <span className={`text-sm font-medium ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

export default function Overview() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Production" value="24,592" change="+12.5%" icon={TrendingUp} positive={true} />
        <StatCard title="Active Machinery" value="142" change="-2.4%" icon={PackageOpen} positive={false} />
        <StatCard title="Total Staff" value="892" change="+4.1%" icon={Users} positive={true} />
        <StatCard title="Pending Alerts" value="12" change="+2" icon={AlertCircle} positive={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 min-h-[400px] flex flex-col transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">Production Output</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-zinc-800/50 rounded-xl bg-gray-50/50 dark:bg-zinc-900/20">
            <span className="text-gray-400 dark:text-zinc-600 text-sm font-medium">Chart visualization placeholder</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Machine #{100+i} maintenance completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{i * 2} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
