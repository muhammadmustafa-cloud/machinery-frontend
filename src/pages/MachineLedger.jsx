import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings2, Download, TrendingDown, Layers, Package
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function MachineLedger() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [machine, setMachine] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchMachine();
  }, []);

  useEffect(() => {
    if (id) fetchLedger();
  }, [id, startDate, endDate]);

  const fetchMachine = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find(m => m._id === id);
        if (found) setMachine(found);
      }
    } catch (err) {
      console.error('Failed to fetch machine');
    }
  };

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/ledger?machineId=${id}&type=OUT`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate)   url += `&endDate=${endDate}`;

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

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const sortedLedger = [...ledger].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalTransactions = sortedLedger.length;
  const totalItemsConsumed = sortedLedger.reduce((sum, e) => sum + e.quantity, 0);
  const uniqueItems = [...new Set(sortedLedger.map(e => e.item?._id))].length;

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('MACHINERY MILL ERP', 14, 18);

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Machine Ledger: ${machine?.name || ''}`, pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Machine Code: ${machine?.code || '—'}   |   Location: ${machine?.location || '—'}   |   Status: ${machine?.status || '—'}`, 14, 36);

    let dateRange = 'Date Range: All Time';
    if (startDate && endDate) dateRange = `Date Range: ${startDate} to ${endDate}`;
    else if (startDate) dateRange = `From: ${startDate}`;
    else if (endDate)   dateRange = `Until: ${endDate}`;
    doc.text(dateRange, 14, 42);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 48);

    const tableColumn = ['Date', 'Day', 'Item', 'Description', 'Qty Used (Debit)'];
    const tableRows = sortedLedger.map(entry => {
      const d = new Date(entry.date);
      return [
        fmtDate(entry.date),
        d.toLocaleDateString('en-US', { weekday: 'short' }),
        entry.item?.name || '-',
        entry.remarks || '-',
        `-${entry.quantity} ${entry.item?.unit || ''}`
      ];
    });

    // Total row
    tableRows.push([
      'TOTAL', '-', `${uniqueItems} item(s)`, '-',
      `-${totalItemsConsumed}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 54,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },  // Date
        1: { halign: 'center', cellWidth: 14 },  // Day
        2: { halign: 'left',   cellWidth: 50 },  // Item
        3: { halign: 'left',   cellWidth: 62 },  // Description
        4: { halign: 'center', cellWidth: 30 },  // Qty Used (Debit)
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'Page ' + doc.internal.getNumberOfPages(),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`Machine_Ledger_${machine?.name || id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/machinery')}
            className="mt-1 p-2 rounded-lg bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {machine?.name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Machine Consumption Ledger
                  {machine?.code && <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{machine.code}</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Machine Info Banner */}
      {machine && (
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{machine.location || '—'}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
            <span className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              machine.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              machine.status === 'Under Maintenance' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {machine.status}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Machine Code</p>
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white mt-0.5">{machine.code || '—'}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Transactions</span>
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTransactions}</p>
          <p className="text-xs text-gray-400 mt-1">records found</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Qty Consumed</span>
            <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{totalItemsConsumed}</p>
          <p className="text-xs text-gray-400 mt-1">units used (debit)</p>
        </div>

        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Unique Items Used</span>
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{uniqueItems}</p>
          <p className="text-xs text-gray-400 mt-1">distinct items</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
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
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Consumption History (Debit)</h2>
          <p className="text-xs text-gray-400 mt-0.5">All items used / consumed by this machine</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Day</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider text-right">Debit (Used)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Loading...</td>
                </tr>
              ) : sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Settings2 className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No consumption records found for this machine.</p>
                  </td>
                </tr>
              ) : (
                sortedLedger.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {fmtDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{entry.item?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {entry.remarks || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        -{entry.quantity}
                        <span className="text-xs font-normal text-gray-400 ml-1">{entry.item?.unit}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedLedger.length > 0 && !isLoading && (
              <tfoot className="bg-gray-50 dark:bg-zinc-900/80 border-t-2 border-gray-200 dark:border-zinc-700">
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right uppercase tracking-wider">
                    Total Consumed:
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      -{totalItemsConsumed}
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
