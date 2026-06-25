import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Briefcase,
  Download, TrendingUp, TrendingDown, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function SupplierLedger() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchSupplier();
  }, []);

  useEffect(() => {
    if (id) fetchLedger();
  }, [id, filterType, startDate, endDate]);

  const fetchSupplier = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find(s => s._id === id);
        if (found) setSupplier(found);
      }
    } catch (err) {
      console.error('Failed to fetch supplier');
    }
  };

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/ledger?supplierId=${id}`;
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

  const sortedLedger = [...ledger].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalTransactions = sortedLedger.length;
  const stockInCount = sortedLedger.filter(e => e.type === 'IN').length;
  const stockOutCount = sortedLedger.filter(e => e.type === 'OUT').length;
  
  const totalCreditQty = sortedLedger.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0);
  const totalDebitQty = sortedLedger.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0);

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('MACHINERY MILL ERP', 14, 18);

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Supplier Ledger: ${supplier?.name || ''}`, 14, 27);

    let dateRange = 'Date Range: All Time';
    if (startDate && endDate) dateRange = `Date Range: ${startDate} to ${endDate}`;
    else if (startDate) dateRange = `From: ${startDate}`;
    else if (endDate) dateRange = `Until: ${endDate}`;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(dateRange, 14, 34);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const tableColumn = ['Date', 'Item', 'Remarks', 'Credit (IN)', 'Debit (OUT)'];
    const tableRows = sortedLedger.map(entry => [
      new Date(entry.date).toLocaleDateString(),
      entry.item?.name || '-',
      entry.remarks || '-',
      entry.type === 'IN' ? `+${entry.quantity} ${entry.item?.unit || ''}` : '-',
      entry.type === 'OUT' ? `-${entry.quantity} ${entry.item?.unit || ''}` : '-'
    ]);

    // Add Total Row to PDF
    tableRows.push([
      'TOTAL',
      '-',
      '-',
      `+${totalCreditQty}`,
      `-${totalDebitQty}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 46,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 26 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Supplier_Ledger_${supplier?.name || id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/suppliers')}
            className="mt-1 p-2 rounded-lg bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {supplier?.name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supplier Ledger
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
          Export Ledger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Received (IN)</span>
            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stockInCount}</p>
          <p className="text-xs text-gray-400 mt-1">transactions</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Returned (OUT)</span>
            <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stockOutCount}</p>
          <p className="text-xs text-gray-400 mt-1">transactions</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Transactions</span>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTransactions}</p>
          <p className="text-xs text-gray-400 mt-1">records found</p>
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
          <option value="OUT">Returned / Used Only</option>
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-4 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Credit (IN)</th>
                <th className="px-6 py-4 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Debit (OUT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Loading...</td>
                </tr>
              ) : sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this supplier.</p>
                  </td>
                </tr>
              ) : (
                sortedLedger.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.item?.name || '-'}</div>
                      <div className="text-xs text-gray-400">{entry.item?.sku || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {entry.remarks || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'IN' ? (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          +{entry.quantity}
                          <span className="text-xs font-normal text-gray-400 ml-1">{entry.item?.unit}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'OUT' ? (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          -{entry.quantity}
                          <span className="text-xs font-normal text-gray-400 ml-1">{entry.item?.unit}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedLedger.length > 0 && !isLoading && (
              <tfoot className="bg-gray-50 dark:bg-zinc-900/80 border-t-2 border-gray-200 dark:border-zinc-700">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right uppercase tracking-wider">
                    Total Qty:
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      +{totalCreditQty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      -{totalDebitQty}
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
