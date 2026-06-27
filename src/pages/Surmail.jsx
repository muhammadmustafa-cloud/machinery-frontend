import React, { useState, useEffect } from 'react';
import { Layers, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function Surmail() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('MACHINERY MILL ERP', 14, 18);

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Surmail (Stock Summary)', 14, 27);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['Item Name', 'SKU', 'Description', 'Credit'];
    const tableRows = filteredItems.map(item => [
      item.name || '-',
      item.sku || '-',
      item.description || '-',
      item.currentStock > 0 ? `+${item.currentStock} ${item.unit || ''}` : `${item.currentStock} ${item.unit || ''}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'right' }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Surmail_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Surmail (Stock Summary)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of all remaining items and their current balances.</p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Remaining Stock (Credit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Loading stock summary...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center">
                    <Layers className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No items found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isPositive = item.currentStock > 0;
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs font-mono text-gray-400 mt-0.5">{item.sku || 'No SKU'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPositive ? (
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            +{item.currentStock} <span className="text-xs font-normal text-gray-400 ml-1">{item.unit}</span>
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                            {item.currentStock} <span className="text-xs font-normal text-gray-500 ml-1">{item.unit}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
