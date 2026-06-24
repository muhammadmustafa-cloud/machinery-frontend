import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ClipboardList, PackageOpen, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function Ledger() {
  const [ledger, setLedger] = useState([]);
  const [items, setItems] = useState([]);
  const [machines, setMachines] = useState([]);
  
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [consumeForm, setConsumeForm] = useState({ item: '', machine: '', quantity: '', remarks: '' });
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterMachine, setFilterMachine] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchLedger();
    fetchItemsAndMachines();
  }, [startDate, endDate, filterItem, filterMachine]);

  const fetchLedger = async () => {
    try {
      let url = `${API_BASE_URL}/api/ledger?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (filterItem) url += `itemId=${filterItem}&`;
      if (filterMachine) url += `machineId=${filterMachine}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLedger(data);
    } catch (err) {
      console.error('Failed to fetch ledger');
    }
  };

  const fetchItemsAndMachines = async () => {
    try {
      const [itemRes, machineRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/items`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/machines`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (itemRes.ok) setItems(await itemRes.json());
      if (machineRes.ok) setMachines(await machineRes.json());
    } catch (err) {}
  };

  const handleConsumeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/ledger/out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(consumeForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsConsumeModalOpen(false);
        fetchLedger();
        fetchItemsAndMachines(); // refresh stock
      } else {
        setErrorMsg(data.message || 'Error consuming stock');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const openConsumeModal = () => {
    setConsumeForm({ item: '', machine: '', quantity: '', remarks: '' });
    setErrorMsg('');
    setIsConsumeModalOpen(true);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('MACHINERY MILL ERP', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Maintenance & Inventory Ledger Report', 14, 28);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let subtitle = 'Date Range: ';
    if (startDate && endDate) subtitle += `${startDate} to ${endDate}`;
    else if (startDate) subtitle += `From ${startDate}`;
    else if (endDate) subtitle += `Until ${endDate}`;
    else subtitle += 'All Time';

    if (filterItem) {
      const selectedItem = items.find(i => i._id === filterItem);
      subtitle += ` | Item: ${selectedItem?.name || 'Unknown'}`;
    }
    if (filterMachine) {
      const selectedMachine = machines.find(m => m._id === filterMachine);
      subtitle += ` | Machine: ${selectedMachine?.name || 'Unknown'}`;
    }
    doc.text(subtitle, 14, 34);
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const tableColumn = ["Date", "Type", "Item", "Quantity", "Machine", "Supplier", "Remarks"];
    const tableRows = [];

    ledger.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      const type = entry.type === 'IN' ? 'STOCK IN' : 'USED';
      const item = `${entry.item?.name || 'Unknown'} (${entry.item?.sku || ''})`;
      const qty = `${entry.type === 'IN' ? '+' : '-'}${entry.quantity} ${entry.item?.unit || ''}`;
      const machine = entry.type === 'OUT' ? (entry.machine?.name || 'Unknown') : '-';
      const supplier = entry.type === 'IN' ? (entry.supplier || 'N/A') : '-';
      const remarks = entry.remarks || (entry.type === 'IN' && entry.price ? `Cost: $${entry.price}` : '-');

      tableRows.push([date, type, item, qty, machine, supplier, remarks]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate-50
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 20 }
      },
      didDrawPage: function (data) {
        // Footer with page number
        let str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          str,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`Ledger_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Maintenance Ledger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all stock additions and machine consumptions.</p>
      </div>

      <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg p-1">
            <Filter className="h-4 w-4 text-gray-400 ml-2" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 dark:text-gray-300 w-32 outline-none"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 dark:text-gray-300 w-32 outline-none"
            />
          </div>
          
          <select 
            value={filterItem} 
            onChange={e => setFilterItem(e.target.value)}
            className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">All Items</option>
            {items.map(item => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>

          <select 
            value={filterMachine} 
            onChange={e => setFilterMachine(e.target.value)}
            className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">All Machines</option>
            {machines.map(machine => (
              <option key={machine._id} value={machine._id}>{machine.name}</option>
            ))}
          </select>

          <button 
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button 
            onClick={openConsumeModal}
            className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-orange-500/20 transition-colors"
          >
            <PackageOpen className="h-4 w-4 mr-2" />
            Consume Stock
          </button>
        </div>

      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {ledger.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4">
                    {entry.type === 'IN' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <ArrowDownRight className="h-3 w-3 mr-1" /> STOCK IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> USED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.item?.name || 'Unknown Item'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {entry.item?.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {entry.type === 'IN' ? '+' : '-'}{entry.quantity} <span className="text-gray-500 text-xs font-normal">{entry.item?.unit}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.type === 'OUT' ? (entry.machine?.name || 'Unknown Machine') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.type === 'IN' ? (entry.supplier || 'N/A') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.remarks || (entry.type === 'IN' && entry.price ? `Cost: $${entry.price}` : 'No remarks')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleString()}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    No ledger entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consume Modal */}
      {isConsumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-orange-50/50 dark:bg-orange-900/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Consume Stock</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign an item from inventory to a machine.</p>
            </div>
            <form onSubmit={handleConsumeSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Item</label>
                <select required value={consumeForm.item} onChange={e => setConsumeForm({...consumeForm, item: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">-- Choose Item --</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>{item.name} ({item.currentStock} {item.unit} available)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Machine</label>
                <select required value={consumeForm.machine} onChange={e => setConsumeForm({...consumeForm, machine: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">-- Choose Machine --</option>
                  {machines.map(machine => (
                    <option key={machine._id} value={machine._id}>{machine.name} ({machine.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity Used</label>
                <input type="number" required step="0.01" min="0.01" value={consumeForm.quantity} onChange={e => setConsumeForm({...consumeForm, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remarks / Reason</label>
                <input type="text" value={consumeForm.remarks} onChange={e => setConsumeForm({...consumeForm, remarks: e.target.value})} placeholder="e.g. Regular maintenance replacement" className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsConsumeModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">{isLoading ? 'Processing...' : 'Confirm Consumption'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
