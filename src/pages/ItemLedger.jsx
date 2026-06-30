import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Package,
  Download, TrendingUp, TrendingDown, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function ItemLedger() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchItem();
  }, []);

  useEffect(() => {
    if (id) fetchLedger();
  }, [id, filterType, startDate, endDate]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItem(data);
      }
    } catch (err) {
      console.error('Failed to fetch item');
    }
  };

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/ledger?itemId=${id}`;
      if (filterType) url += `&type=${filterType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from full ledger (no type filter) for the stats row
  const totalIn = ledger.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0);
  const totalOut = ledger.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0);

  // Running balance calculation (full list, oldest first)
  const sortedLedger = [...ledger].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningBalance = 0;
  const ledgerWithBalance = sortedLedger.map(entry => {
    if (entry.type === 'IN') runningBalance += entry.quantity;
    else runningBalance -= entry.quantity;
    return { ...entry, balance: runningBalance };
  });

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('MACHINERY MILL ERP', 14, 18);

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(`Item Stock Report: ${item?.name || ''}`, pageWidth / 2, 27, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`SKU: ${item?.sku || ''}  |  Unit: ${item?.unit || ''}  |  Current Stock: ${item?.currentStock ?? 0} ${item?.unit || ''}`, 14, 34);

    let dateRange = 'Date Range: All Time';
    if (startDate && endDate) dateRange = `Date Range: ${startDate} to ${endDate}`;
    else if (startDate) dateRange = `From: ${startDate}`;
    else if (endDate) dateRange = `Until: ${endDate}`;
    doc.text(dateRange, 14, 40);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 46);

    // Summary boxes
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(`Total IN: +${totalIn} ${item?.unit || ''}`, 14, 55);
    doc.setTextColor(234, 88, 12);
    doc.text(`Total OUT: -${totalOut} ${item?.unit || ''}`, 80, 55);
    doc.setTextColor(40, 40, 40);
    doc.text(`Current Stock: ${item?.currentStock ?? 0} ${item?.unit || ''}`, 150, 55);

    const tableColumn = ['Date', 'Day', 'Machine / Supplier', 'Description', 'Credit (IN)', 'Debit (OUT)', 'Balance'];
    const tableRows = ledgerWithBalance.map(entry => {
      const d = new Date(entry.date);
      return [
        d.toLocaleDateString(),
        d.toLocaleDateString('en-US', { weekday: 'short' }),
        entry.type === 'OUT' ? (entry.machine?.name || '-') : (entry.supplier?.name || '-'),
        entry.remarks || '-',
        entry.type === 'IN' ? `+${entry.quantity} ${item?.unit || ''}` : '-',
        entry.type === 'OUT' ? `-${entry.quantity} ${item?.unit || ''}` : '-',
        `${entry.balance} ${item?.unit || ''}`
      ];
    });
    
    // Add Total Row to PDF
    tableRows.push([
      'TOTAL',
      '-',
      '-',
      '-',
      `+${totalIn} ${item?.unit || ''}`,
      `-${totalOut} ${item?.unit || ''}`,
      `${ledgerWithBalance.length > 0 ? ledgerWithBalance[ledgerWithBalance.length - 1].balance : 0} ${item?.unit || ''}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'center', cellWidth: 24 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Stock_Report_${item?.name || id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/inventory')}
            className="mt-1 p-2 rounded-lg bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {item?.name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: <span className="font-mono">{item?.sku}</span> · Unit: {item?.unit}
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Stock Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Stock In</span>
            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{totalIn}</p>
          <p className="text-xs text-gray-400 mt-1">{item?.unit} purchased (filtered view)</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Used</span>
            <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">-{totalOut}</p>
          <p className="text-xs text-gray-400 mt-1">{item?.unit} consumed (filtered view)</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Stock</span>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              item?.currentStock <= (item?.minStockAlert || 0)
                ? 'bg-red-100 dark:bg-red-900/20'
                : 'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              <Layers className={`h-5 w-5 ${
                item?.currentStock <= (item?.minStockAlert || 0)
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${
            item?.currentStock <= (item?.minStockAlert || 0)
              ? 'text-red-600 dark:text-red-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>{item?.currentStock ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">{item?.unit} remaining · Alert at {item?.minStockAlert}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="IN">Stock In Only</option>
          <option value="OUT">Used Only</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <span className="text-gray-400">—</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Machine / Supplier</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Credit (IN)</th>
                <th className="px-6 py-4 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Debit (OUT)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Loading...</td>
                </tr>
              ) : ledgerWithBalance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <Package className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this item.</p>
                  </td>
                </tr>
              ) : (
                ledgerWithBalance.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'OUT' ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.machine?.name || '-'}</div>
                          <div className="text-xs text-gray-400">{entry.machine?.code || ''}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{entry.supplier?.name || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {entry.remarks || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'IN' ? (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          +{entry.quantity}
                          <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'OUT' ? (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          -{entry.quantity}
                          <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {entry.balance}
                        <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ledgerWithBalance.length > 0 && !isLoading && (
              <tfoot className="bg-gray-50 dark:bg-zinc-900/80 border-t-2 border-gray-200 dark:border-zinc-700">
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      +{totalIn} <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      -{totalOut} <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {ledgerWithBalance[ledgerWithBalance.length - 1].balance} <span className="text-xs font-normal text-gray-400 ml-1">{item?.unit}</span>
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
