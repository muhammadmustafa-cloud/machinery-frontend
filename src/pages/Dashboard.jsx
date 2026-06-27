import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Overview from './Overview';
import Users from './Users';
import Inventory from './Inventory';
import Machinery from './Machinery';
import Ledger from './Ledger';
import Suppliers from './Suppliers';
import ItemLedger from './ItemLedger';
import DailyStock from './DailyStock';
import SupplierLedger from './SupplierLedger';
import Surmail from './Surmail';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black transition-colors duration-300 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/machinery" element={<Machinery />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/users" element={<Users />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/inventory/:id/ledger" element={<ItemLedger />} />
            <Route path="/suppliers/:id/ledger" element={<SupplierLedger />} />
            <Route path="/daily-stock" element={<DailyStock />} />
            <Route path="/surmail" element={<Surmail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
