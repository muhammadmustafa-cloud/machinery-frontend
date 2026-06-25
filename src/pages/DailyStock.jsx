import React, { useState, useEffect } from 'react';
import { CalendarDays, Download, Filter, Activity, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function DailyStock() {
  const todayKey = new Date().toLocaleDateString('en-CA');
  const [ledger, setLedger] = useState([]);
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);
  const [isLoading, setIsLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

  useEffect(() => { fetchLedger(); }, [startDate, endDate]);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/ledger?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate)   url += `endDate=${endDate}&`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setLedger(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // Group by date
  const groupedByDay = ledger.reduce((acc, entry) => {
    const key = new Date(entry.date).toLocaleDateString('en-CA');
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort((a, b) => new Date(b) - new Date(a));

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const fmtDay  = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // PDF Export — A4 Portrait
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 10;
    const midX = W / 2;

    const drawPageHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, W, 20, 'F');
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('MACHINERY MILL ERP', midX, 9, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 220);
      doc.text('Daily Stock Ledger - T-Account Report', midX, 15, { align: 'center' });
    };

    drawPageHeader();

    doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    let rangeLabel = 'Date Range: All Time';
    if (startDate && endDate) rangeLabel = `Date Range: ${startDate} to ${endDate}`;
    else if (startDate) rangeLabel = `From: ${startDate}`;
    else if (endDate)   rangeLabel = `Until: ${endDate}`;
    doc.text(rangeLabel, margin, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - margin, 26, { align: 'right' });

    let curY = 30;

    sortedDays.forEach((day) => {
      const entries = groupedByDay[day];
      const ins     = entries.filter(e => e.type === 'IN');
      const outs    = entries.filter(e => e.type === 'OUT');
      const rows    = Math.max(ins.length, outs.length);
      const dayIn   = ins.reduce((s, e) => s + e.quantity, 0);
      const dayOut  = outs.reduce((s, e) => s + e.quantity, 0);

      if (curY > H - 50) { doc.addPage(); drawPageHeader(); curY = 28; }

      const colW  = (W - margin * 2) / 2;
      const dateW = 18;

      // Credit header
      doc.setFillColor(5, 150, 105);
      doc.rect(margin, curY, colW, 7, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('CREDIT (AAMAD / STOCK IN)', margin + colW / 2, curY + 5, { align: 'center' });

      // Debit header
      doc.setFillColor(220, 38, 38);
      doc.rect(margin + colW, curY, colW, 7, 'F');
      doc.text('DEBIT (KHARCH / STOCK OUT)', margin + colW + colW / 2, curY + 5, { align: 'center' });
      curY += 7;

      // Sub-column headers
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, curY, W - margin * 2, 6, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100);
      doc.text('DATE', margin + 1, curY + 4);
      doc.text('ITEM / SUPPLIER', margin + dateW, curY + 4);
      doc.text('AMOUNT', margin + colW - 2, curY + 4, { align: 'right' });
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + colW, curY, margin + colW, curY + 6);
      doc.text('DATE', margin + colW + 1, curY + 4);
      doc.text('ITEM / MACHINE', margin + colW + dateW, curY + 4);
      doc.text('AMOUNT', W - margin - 2, curY + 4, { align: 'right' });
      curY += 6;

      // Paired rows
      for (let i = 0; i < rows; i++) {
        const cr   = ins[i];
        const db   = outs[i];
        const rowH = 10;

        if (curY + rowH > H - 20) { doc.addPage(); drawPageHeader(); curY = 28; }

        if (i % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, curY, W - margin * 2, rowH, 'F');
        }

        doc.setDrawColor(229, 231, 235);
        doc.line(margin, curY + rowH, W - margin, curY + rowH);
        doc.line(margin + colW, curY, margin + colW, curY + rowH);

        if (cr) {
          doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          doc.text(fmtDate(cr.date), margin + 1, curY + 4);
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text((cr.item?.name || '-').substring(0, 24), margin + dateW, curY + 4);
          doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(5, 150, 105);
          doc.text(`> ${(cr.supplier?.name || 'N/A').substring(0, 20)}`, margin + dateW, curY + 8);
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 150, 105);
          doc.text(`+${cr.quantity} ${cr.item?.unit || ''}`, margin + colW - 2, curY + 5, { align: 'right' });
        } else {
          doc.setFontSize(8); doc.setTextColor(200, 200, 200);
          doc.text('-', margin + colW / 2, curY + 6, { align: 'center' });
        }

        if (db) {
          doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          doc.text(fmtDate(db.date), margin + colW + 1, curY + 4);
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
          doc.text((db.item?.name || '-').substring(0, 24), margin + colW + dateW, curY + 4);
          doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(220, 38, 38);
          doc.text(`> ${(db.machine?.name || 'N/A').substring(0, 20)}`, margin + colW + dateW, curY + 8);
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38);
          doc.text(`-${db.quantity} ${db.item?.unit || ''}`, W - margin - 2, curY + 5, { align: 'right' });
        } else {
          doc.setFontSize(8); doc.setTextColor(200, 200, 200);
          doc.text('-', margin + colW + colW / 2, curY + 6, { align: 'center' });
        }

        curY += rowH;
      }

      // Day total footer
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, W - margin * 2, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, curY, W - margin, curY);
      doc.line(margin, curY + 7, W - margin, curY + 7);
      doc.line(margin + colW, curY, margin + colW, curY + 7);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('TOTAL CREDIT', margin + 2, curY + 5);
      doc.text(`+${dayIn}`, margin + colW - 2, curY + 5, { align: 'right' });
      doc.setTextColor(220, 38, 38);
      doc.text('TOTAL DEBIT', margin + colW + 2, curY + 5);
      doc.text(`-${dayOut}`, W - margin - 2, curY + 5, { align: 'right' });

      curY += 12;
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
      doc.text(`Page ${p} of ${totalPages}`, midX, H - 6, { align: 'center' });
    }

    doc.save(`Daily_Stock_Ledger_${startDate || 'all'}_${endDate || 'all'}.pdf`);
  };

  return (
    <div className="max-w-full mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Daily Stock Ledger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">T-Account view — Credit (IN) and Debit (OUT) side by side per day.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 w-32"
          />
          <span className="text-gray-300 dark:text-zinc-600">—</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 w-32"
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Daily T-Account Blocks */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
          <Activity className="h-8 w-8 mx-auto mb-3 text-gray-300 animate-pulse" />
          <p className="text-sm text-gray-400">Loading daily ledger...</p>
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDays.map(day => {
            const entries = groupedByDay[day];
            const ins     = entries.filter(e => e.type === 'IN');
            const outs    = entries.filter(e => e.type === 'OUT');
            const dayIn   = ins.reduce((s, e) => s + e.quantity, 0);
            const dayOut  = outs.reduce((s, e) => s + e.quantity, 0);
            const rows    = Math.max(ins.length, outs.length);

            return (
              <div key={day} className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">

                {/* Split Header */}
                <div className="grid grid-cols-2">
                  <div className="bg-emerald-600 px-6 py-3 flex items-center justify-center border-r border-emerald-700">
                    <span className="text-white font-bold text-sm tracking-widest uppercase">Credit (Aamad / Stock IN)</span>
                  </div>
                  <div className="bg-red-600 px-6 py-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm tracking-widest uppercase">Debit (Kharch / Stock OUT)</span>
                  </div>
                </div>

                {/* Sub-column Headers */}
                <div className="grid grid-cols-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/60">
                  <div className="grid grid-cols-[80px_1fr_1fr_90px] border-r border-gray-200 dark:border-zinc-700">
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item / Supplier</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-right">Amount</div>
                  </div>
                  <div className="grid grid-cols-[80px_1fr_1fr_90px]">
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item / Machine</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider text-right">Amount</div>
                  </div>
                </div>

                {/* Paired Rows */}
                {Array.from({ length: rows }).map((_, i) => {
                  const cr = ins[i];
                  const db = outs[i];
                  const isAlt = i % 2 === 1;
                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-2 border-b border-gray-100 dark:border-zinc-800/50 ${isAlt ? 'bg-gray-50/70 dark:bg-zinc-900/30' : 'bg-white dark:bg-[#09090b]'}`}
                    >
                      {/* Credit cell */}
                      <div className="grid grid-cols-[80px_1fr_1fr_90px] border-r border-gray-200 dark:border-zinc-700 items-center">
                        {cr ? (
                          <>
                            <div className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {fmtDate(cr.date)}
                            </div>
                            <div className="px-4 py-3.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{cr.item?.name || '-'}</p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <ArrowRight className="h-3 w-3" />{cr.supplier?.name || 'N/A'}
                              </p>
                              <p className="text-xs font-mono text-gray-400 mt-0.5">{cr.item?.sku}</p>
                            </div>
                            <div className="px-4 py-3.5">
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {cr.item?.description || <span className="italic text-gray-300 dark:text-zinc-600">No description</span>}
                              </p>
                              {cr.remarks && <p className="text-xs text-gray-400 italic mt-0.5">{cr.remarks}</p>}
                            </div>
                            <div className="px-4 py-3.5 text-right">
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{cr.quantity}</span>
                              <span className="text-xs text-gray-400 ml-1">{cr.item?.unit}</span>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-4 px-4 py-3.5 text-center text-gray-200 dark:text-zinc-700 text-xs italic">—</div>
                        )}
                      </div>

                      {/* Debit cell */}
                      <div className="grid grid-cols-[80px_1fr_1fr_90px] items-center">
                        {db ? (
                          <>
                            <div className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {fmtDate(db.date)}
                            </div>
                            <div className="px-4 py-3.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{db.item?.name || '-'}</p>
                              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                                <ArrowRight className="h-3 w-3" />{db.machine?.name || 'N/A'}
                              </p>
                              <p className="text-xs font-mono text-gray-400 mt-0.5">{db.item?.sku}</p>
                            </div>
                            <div className="px-4 py-3.5">
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {db.item?.description || <span className="italic text-gray-300 dark:text-zinc-600">No description</span>}
                              </p>
                              {db.remarks && <p className="text-xs text-gray-400 italic mt-0.5">{db.remarks}</p>}
                            </div>
                            <div className="px-4 py-3.5 text-right">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">-{db.quantity}</span>
                              <span className="text-xs text-gray-400 ml-1">{db.item?.unit}</span>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-4 px-4 py-3.5 text-center text-gray-200 dark:text-zinc-700 text-xs italic">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Day Footer Totals */}
                <div className="grid grid-cols-2 border-t-2 border-gray-300 dark:border-zinc-600">
                  <div className="grid grid-cols-[1fr_90px] border-r border-gray-200 dark:border-zinc-700 bg-emerald-50 dark:bg-emerald-900/10">
                    <div className="px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Credit</div>
                    <div className="px-4 py-3 text-right text-sm font-bold text-emerald-700 dark:text-emerald-400">+{dayIn}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_90px] bg-red-50 dark:bg-red-900/10">
                    <div className="px-4 py-3 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Total Debit</div>
                    <div className="px-4 py-3 text-right text-sm font-bold text-red-700 dark:text-red-400">-{dayOut}</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
