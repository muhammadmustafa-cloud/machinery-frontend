import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ClipboardList, PackageOpen, Download, Filter, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function Ledger() {
  const [ledger, setLedger] = useState([]);
  const [items, setItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'IN',
    supplier: '',
    machine: '',
    remarks: '',
    items: [{ item: '', quantity: '', price: '' }]
  });
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterType, setFilterType] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchLedger();
    fetchData();
  }, [startDate, endDate, filterItem, filterMachine, filterType]);

  const fetchLedger = async () => {
    try {
      let url = `${API_BASE_URL}/api/ledger?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (filterItem) url += `itemId=${filterItem}&`;
      if (filterMachine) url += `machineId=${filterMachine}&`;
      if (filterType) url += `type=${filterType}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLedger(data);
    } catch (err) {
      console.error('Failed to fetch ledger');
    }
  };

  const fetchData = async () => {
    try {
      const [itemRes, machineRes, supplierRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/items`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/machines`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (itemRes.ok) setItems(await itemRes.json());
      if (machineRes.ok) setMachines(await machineRes.json());
      if (supplierRes.ok) setSuppliers(await supplierRes.json());
    } catch (err) {}
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/ledger/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(transactionForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsTransactionModalOpen(false);
        fetchLedger();
        fetchData();
      } else {
        setErrorMsg(data.message || 'Error processing transaction');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const openTransactionModal = () => {
    setTransactionForm({
      type: 'IN',
      supplier: '',
      machine: '',
      remarks: '',
      items: [{ item: '', quantity: '', price: '' }]
    });
    setErrorMsg('');
    setIsTransactionModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...transactionForm.items];
    newItems[index][field] = value;
    setTransactionForm({ ...transactionForm, items: newItems });
  };

  const addItemRow = () => {
    setTransactionForm({
      ...transactionForm,
      items: [...transactionForm.items, { item: '', quantity: '', price: '' }]
    });
  };

  const removeItemRow = (index) => {
    const newItems = transactionForm.items.filter((_, i) => i !== index);
    setTransactionForm({ ...transactionForm, items: newItems });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
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
    if (filterType) {
      subtitle += ` | Type: ${filterType === 'IN' ? 'STOCK IN' : 'USED'}`;
    }
    doc.text(subtitle, 14, 34);
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const sortedLedger = [...ledger].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalCreditQty = sortedLedger.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0);
    const totalDebitQty = sortedLedger.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0);

    const tableColumn = ['Date', 'Type', 'Item Details', 'Quantity', 'Machine / Supplier', 'Remarks', 'User'];
    const tableRows = sortedLedger.map(entry => [
      new Date(entry.date).toLocaleString(),
      entry.type === 'IN' ? 'STOCK IN' : 'USED',
      `${entry.item?.name || 'Unknown'} (SKU: ${entry.item?.sku || '-'})`,
      `${entry.type === 'IN' ? '+' : '-'}${entry.quantity} ${entry.item?.unit || ''}`,
      entry.type === 'IN' ? (entry.supplier?.name || 'N/A') : (entry.machine?.name || 'N/A'),
      entry.remarks || (entry.type === 'IN' && entry.price ? `Cost: $${entry.price}` : '-'),
      entry.performedBy?.name || 'System'
    ]);
    
    // Add Total Row to PDF
    tableRows.push([
      'TOTAL',
      '-',
      '-',
      `+${totalCreditQty} IN / -${totalDebitQty} OUT`,
      '-',
      '-',
      '-'
    ]);

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
        let str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
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
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Used</option>
          </select>

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
            onClick={openTransactionModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
          >
            <PackageOpen className="h-4 w-4 mr-2" />
            Add Transaction
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
              {[...ledger].sort((a, b) => new Date(a.date) - new Date(b.date)).map((entry) => (
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
                      {entry.type === 'IN' ? (entry.supplier?.name || 'N/A') : '-'}
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
            {ledger.length > 0 && !isLoading && (
              <tfoot className="bg-gray-50 dark:bg-zinc-900/80 border-t-2 border-gray-200 dark:border-zinc-700">
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right uppercase tracking-wider">
                    Total Qty:
                  </td>
                  <td colSpan="5" className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 mr-4">
                      +{ledger.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0)} IN
                    </span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      -{ledger.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0)} OUT
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Unified Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 my-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Transaction</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Process multiple items in a single transaction.</p>
              </div>
              <button onClick={() => setIsTransactionModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">×</button>
            </div>
            
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                  <select 
                    required 
                    value={transactionForm.type} 
                    onChange={e => setTransactionForm({...transactionForm, type: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white"
                  >
                    <option value="IN">Stock In (Purchase)</option>
                    <option value="OUT">Used (Consume)</option>
                  </select>
                </div>

                {transactionForm.type === 'IN' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                    <select 
                      required 
                      value={transactionForm.supplier} 
                      onChange={e => setTransactionForm({...transactionForm, supplier: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Machine</label>
                    <select 
                      required 
                      value={transactionForm.machine} 
                      onChange={e => setTransactionForm({...transactionForm, machine: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="">-- Choose Machine --</option>
                      {machines.map(m => <option key={m._id} value={m._id}>{m.name} ({m.code})</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Global Remarks (Optional)</label>
                <input 
                  type="text" 
                  value={transactionForm.remarks} 
                  onChange={e => setTransactionForm({...transactionForm, remarks: e.target.value})}
                  placeholder="Invoice # or common reason"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white" 
                />
              </div>

              <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Items in Transaction</h4>
                  <button 
                    type="button" 
                    onClick={addItemRow}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Another Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {transactionForm.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-gray-100 dark:border-zinc-800/50">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Item</label>
                        <select 
                          required 
                          value={item.item} 
                          onChange={e => handleItemChange(index, 'item', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none"
                        >
                          <option value="">-- Select Item --</option>
                          {items.map(i => (
                            <option key={i._id} value={i._id}>
                              {i.name} {transactionForm.type === 'OUT' ? `(${i.currentStock} ${i.unit} available)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input 
                          type="number" 
                          required 
                          min="0.01" 
                          step="0.01"
                          value={item.quantity} 
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none" 
                        />
                      </div>
                      {transactionForm.items.length > 1 && (
                        <div className="pt-5">
                          <button 
                            type="button" 
                            onClick={() => removeItemRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Submit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
