import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Banknote, CreditCard, TrendingUp, TrendingDown, ShoppingCart,
  Package, BadgeCheck, FileDown, Calendar,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { profitLossService } from '@stockbite/api-client';
import type { ReportRangeDto } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';

/* ─── Helpers ────────────────────────────────────────────────────── */
function toStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmt(v: number) { return `₺${v.toFixed(2)}`; }
function trDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

type Period = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

function periodRange(p: Period): { from: string; to: string } {
  const now = new Date();
  const today = toStr(now);

  if (p === 'today') return { from: today, to: today };

  if (p === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const mon = new Date(now); mon.setDate(now.getDate() - day);
    return { from: toStr(mon), to: today };
  }

  if (p === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toStr(first), to: today };
  }

  if (p === 'lastMonth') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toStr(first), to: toStr(last) };
  }

  return { from: today, to: today };
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  lastMonth: 'Geçen Ay',
  custom: 'Özel',
};

/* ─── PDF helpers ────────────────────────────────────────────────── */
// jsPDF's built-in Helvetica does not support Turkish chars or ₺.
// We transliterate for PDF only — screen display keeps originals.
function tr2ascii(s: string): string {
  return s
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/û/g, 'u').replace(/Û/g, 'U');
}
function p(s: string) { return tr2ascii(s); }
function money(v: number) { return `${v.toFixed(2)} TL`; }
function pDate(iso: string) {
  const d = new Date(iso);
  const months = ['Oca','Sub','Mar','Nis','May','Haz','Tem','Agu','Eyl','Eki','Kas','Ara'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function pDateShort(iso: string) {
  const d = new Date(iso);
  const months = ['Oca','Sub','Mar','Nis','May','Haz','Tem','Agu','Eyl','Eki','Kas','Ara'];
  const days = ['Paz','Pzt','Sal','Car','Per','Cum','Cmt'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

/* ─── PDF Export ─────────────────────────────────────────────────── */
function exportPdf(report: ReportRangeDto, from: string, to: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Header bar ──
  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('StockBite', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Finansal Rapor', margin, 21);

  const periodLabel = from === to ? pDate(from) : `${pDate(from)} - ${pDate(to)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(p(periodLabel), pageW - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const now = new Date();
  doc.text(
    `Olusturulma: ${now.getDate().toString().padStart(2,'0')}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`,
    pageW - margin, 21, { align: 'right' }
  );

  let y = 42;

  // ── Section: Gelir Ozeti ──
  doc.setTextColor(109, 40, 217);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GELIR OZETI', margin, y);
  y += 2;

  // two-column summary layout
  const col1x = margin;
  const col2x = pageW / 2 + 4;
  const colW  = pageW / 2 - margin - 4;

  const leftItems = [
    { label: 'Nakit Gelir',      value: money(report.cashRevenue),              color: [22, 163, 74]  as [number,number,number] },
    { label: 'Kart Gelir',       value: money(report.cardRevenue),              color: [37, 99, 235]  as [number,number,number] },
    { label: 'Abonelik Geliri',  value: money(report.subscriptionRevenue ?? 0), color: [124, 58, 237] as [number,number,number] },
    { label: 'TOPLAM GELIR',     value: money(report.totalRevenue),             color: [30, 30, 30]   as [number,number,number], bold: true },
  ];
  const rightItems = [
    { label: 'Stok Alim Gideri',   value: `-${money(report.stockPurchaseCost)}`,    color: [234, 88, 12]  as [number,number,number] },
    { label: 'Malzeme Maliyeti',   value: `-${money(report.totalCost)}`,             color: [220, 38, 38]  as [number,number,number] },
    { label: 'Diger Giderler',     value: `-${money(report.otherExpenses ?? 0)}`,    color: [219, 39, 119] as [number,number,number] },
    { label: 'TOPLAM GIDER',       value: `-${money(report.totalCost + report.stockPurchaseCost + (report.otherExpenses ?? 0))}`,
                                                                                      color: [30, 30, 30]   as [number,number,number], bold: true },
  ];

  y += 5;
  const rowH = 7;
  const startY = y;

  leftItems.forEach((item, i) => {
    const ry = startY + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(248, 246, 255);
      doc.rect(col1x - 1, ry - 4, colW + 2, rowH, 'F');
    }
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.text(p(item.label), col1x + 1, ry);
    doc.text(item.value, col1x + colW - 1, ry, { align: 'right' });
  });

  rightItems.forEach((item, i) => {
    const ry = startY + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(255, 248, 248);
      doc.rect(col2x - 1, ry - 4, colW + 2, rowH, 'F');
    }
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.text(p(item.label), col2x + 1, ry);
    doc.text(item.value, col2x + colW - 1, ry, { align: 'right' });
  });

  y = startY + leftItems.length * rowH + 6;

  // ── Net Kar box ──
  const isProfit = report.grossProfit >= 0;
  doc.setFillColor(...(isProfit ? [236, 253, 245] : [254, 242, 242]) as [number,number,number]);
  doc.setDrawColor(...(isProfit ? [16, 185, 129] : [239, 68, 68]) as [number,number,number]);
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, 'FD');

  doc.setTextColor(...(isProfit ? [5, 150, 105] : [185, 28, 28]) as [number,number,number]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET KAR', margin + 5, y + 9);
  doc.setFontSize(13);
  const profitStr = `${isProfit ? '+' : ''}${money(report.grossProfit)}`;
  doc.text(profitStr, pageW - margin - 5, y + 9, { align: 'right' });

  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${report.totalOrders ?? report.dailySummaries.reduce((s, d) => s + d.orderCount, 0)} siparis`, pageW / 2, y + 9, { align: 'center' });

  y += 22;

  // ── Daily Detail table ──
  if (report.dailySummaries.length > 0) {
    doc.setTextColor(109, 40, 217);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GUNLUK DETAY', margin, y);
    y += 4;

    const totalExpense = (d: typeof report.dailySummaries[0]) =>
      d.totalCost + (d.otherExpenses ?? 0) + d.stockPurchaseCost;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tarih', 'Nakit (TL)', 'Kart (TL)', 'Top. Gelir', 'Gider', 'Net Kar', 'Masa', 'Siparis']],
      body: [
        ...report.dailySummaries.map(d => [
          pDateShort(d.date),
          d.cashRevenue.toFixed(2),
          d.cardRevenue.toFixed(2),
          d.totalRevenue.toFixed(2),
          `-${totalExpense(d).toFixed(2)}`,
          `${d.grossProfit >= 0 ? '+' : ''}${d.grossProfit.toFixed(2)}`,
          String(d.tableCount),
          String(d.orderCount),
        ]),
        [
          'TOPLAM',
          report.cashRevenue.toFixed(2),
          report.cardRevenue.toFixed(2),
          report.totalRevenue.toFixed(2),
          `-${(report.totalCost + (report.otherExpenses ?? 0) + report.stockPurchaseCost).toFixed(2)}`,
          `${report.grossProfit >= 0 ? '+' : ''}${report.grossProfit.toFixed(2)}`,
          String(report.dailySummaries.reduce((s, d) => s + d.tableCount, 0)),
          String(report.dailySummaries.reduce((s, d) => s + d.orderCount, 0)),
        ],
      ],
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'right' },
      columnStyles: {
        0: { halign: 'left',  cellWidth: 22 },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 14 },
        7: { halign: 'right', cellWidth: 14 },
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 246, 255] },
      didParseCell: (data) => {
        const isLastRow = data.row.index === report.dailySummaries.length;
        if (data.section === 'body' && isLastRow) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [237, 233, 254];
        }
        if (data.section === 'body' && data.column.index === 5 && !isLastRow) {
          const val = report.dailySummaries[data.row.index]?.grossProfit ?? 0;
          data.cell.styles.textColor = val >= 0 ? [5, 150, 105] : [220, 38, 38];
        }
        if (data.section === 'body' && data.column.index === 5 && isLastRow) {
          data.cell.styles.textColor = report.grossProfit >= 0 ? [5, 150, 105] : [220, 38, 38];
        }
      },
    });

    // ── Top 5 Products ──
    if (report.topProducts && report.topProducts.length > 0) {
      const afterDaily = (doc as any).lastAutoTable.finalY + 8;
      doc.setTextColor(109, 40, 217);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EN COK SATAN 5 URUN', margin, afterDaily);

      autoTable(doc, {
        startY: afterDaily + 4,
        margin: { left: margin, right: margin },
        head: [['Sira', 'Urun Adi', 'Adet', 'Ciro (TL)']],
        body: report.topProducts.map((prod, i) => [
          String(i + 1),
          p(prod.name),
          String(prod.totalQuantity),
          prod.totalRevenue.toFixed(2),
        ]),
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 30 },
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }
  }

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 243, 255);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('StockBite Finansal Rapor', margin, pageH - 4);
    doc.text(`Sayfa ${i} / ${totalPages}`, pageW / 2, pageH - 4, { align: 'center' });
    doc.text(p(periodLabel), pageW - margin, pageH - 4, { align: 'right' });
  }

  doc.save(`rapor_${from}${from !== to ? `_${to}` : ''}.pdf`);
}

/* ─── Page ───────────────────────────────────────────────────────── */
export function ReportsPage() {
  const today = toStr(new Date());
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]   = useState(today);

  const { from, to } = period === 'custom'
    ? { from: customFrom, to: customTo }
    : periodRange(period);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['reports', 'range', from, to],
    queryFn: () => profitLossService.getReportRange(from, to),
    enabled: !!from && !!to,
    refetchOnMount: 'always',
  });

  const chartData = report?.dailySummaries.map(d => ({
    date: d.date.split('T')[0],
    'Nakit': Number(d.cashRevenue.toFixed(2)),
    'Kart': Number(d.cardRevenue.toFixed(2)),
    'Gider': Number((d.totalCost + (d.otherExpenses ?? 0) + d.stockPurchaseCost).toFixed(2)),
    'Net Kâr': Number(d.grossProfit.toFixed(2)),
  }));

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finansal Rapor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Günlük, haftalık ve aylık gelir / gider analizi</p>
        </div>
        {report && (
          <button
            onClick={() => exportPdf(report, from, to)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <FileDown size={16} />
            PDF İndir
          </button>
        )}
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-slate-400" />
          {(['today', 'week', 'month', 'lastMonth', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Başlangıç</label>
              <input type="date" value={customFrom} max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Bitiş</label>
              <input type="date" value={customTo} min={customFrom} max={today}
                onChange={e => setCustomTo(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-400" />
            </div>
          </div>
        )}

        {period !== 'custom' && (
          <p className="text-xs text-slate-400">
            {from === to ? trDate(from) : `${trDate(from)} — ${trDate(to)}`}
          </p>
        )}
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {isError   && <div className="py-10 text-center text-sm text-red-500">Rapor verileri yüklenemedi.</div>}

      {!isLoading && !isError && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nakit Gelir',      value: fmt(report.cashRevenue),               icon: <Banknote size={18}    className="text-green-600"  />, bg: 'bg-green-50',  border: 'border-green-200'  },
              { label: 'Kart Gelir',       value: fmt(report.cardRevenue),               icon: <CreditCard size={18}  className="text-blue-600"   />, bg: 'bg-blue-50',   border: 'border-blue-200'   },
              { label: 'Abonelik',         value: fmt(report.subscriptionRevenue ?? 0),  icon: <BadgeCheck size={18}  className="text-violet-600" />, bg: 'bg-violet-50', border: 'border-violet-200' },
              { label: 'Toplam Gelir',     value: fmt(report.totalRevenue),              icon: <TrendingUp size={18}  className="text-indigo-600" />, bg: 'bg-indigo-50', border: 'border-indigo-200' },
              { label: 'Stok Alım',        value: `-${fmt(report.stockPurchaseCost)}`,   icon: <Package size={18}     className="text-orange-600" />, bg: 'bg-orange-50', border: 'border-orange-200' },
              { label: 'Malzeme Maliyeti', value: `-${fmt(report.totalCost)}`,           icon: <TrendingDown size={18} className="text-red-500"   />, bg: 'bg-red-50',    border: 'border-red-200'    },
              { label: 'Diğer Giderler',   value: `-${fmt(report.otherExpenses ?? 0)}`,  icon: <TrendingDown size={18} className="text-pink-500"  />, bg: 'bg-pink-50',   border: 'border-pink-200'   },
            ].map(({ label, value, icon, bg, border }) => (
              <div key={label} className={`rounded-xl border ${border} ${bg} p-3 sm:p-4`}>
                <div className="mb-2">{icon}</div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}

            {/* Net Kâr */}
            <div className={`rounded-xl border p-3 sm:p-4 col-span-2 sm:col-span-1 ${
              report.grossProfit >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
            }`}>
              <div className="mb-2">
                <ShoppingCart size={18} className={report.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
              </div>
              <p className="text-xs text-slate-500">Net Kâr</p>
              <p className={`text-xl font-black mt-0.5 ${report.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {report.grossProfit >= 0 ? '+' : ''}{fmt(report.grossProfit)}
              </p>
            </div>
          </div>

          {/* Chart */}
          {chartData && chartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Günlük Gelir / Gider</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Nakit"   fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Kart"    fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Gider"   fill="#f97316" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Net Kâr" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Günlük Detay</h3>
              <span className="text-xs text-slate-400">{report.dailySummaries.length} gün</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                    <th className="text-left px-4 py-3 text-slate-500">Tarih</th>
                    <th className="text-right px-4 py-3 text-green-600">Nakit</th>
                    <th className="text-right px-4 py-3 text-blue-600">Kart</th>
                    <th className="text-right px-4 py-3 text-slate-500">Toplam Gelir</th>
                    <th className="text-right px-4 py-3 text-red-500">Gider</th>
                    <th className="text-right px-4 py-3 text-emerald-600">Net Kâr</th>
                    <th className="text-right px-4 py-3 text-violet-600">Masa</th>
                    <th className="text-right px-4 py-3 text-slate-400">Sipariş</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailySummaries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 text-sm">Bu dönemde veri yok</td>
                    </tr>
                  )}
                  {report.dailySummaries.map((d, idx) => {
                    const totalExpense = d.totalCost + (d.otherExpenses ?? 0) + d.stockPurchaseCost;
                    return (
                      <tr key={d.date} className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-700">
                          {new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-2.5 text-right text-green-700">{fmt(d.cashRevenue)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-700">{fmt(d.cardRevenue)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-900 font-medium">{fmt(d.totalRevenue)}</td>
                        <td className="px-4 py-2.5 text-right text-red-500">-{fmt(totalExpense)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${d.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.grossProfit >= 0 ? '+' : ''}{fmt(d.grossProfit)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-violet-600">{d.tableCount ?? 0}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{d.orderCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {report.dailySummaries.length > 1 && (
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-200 font-bold text-sm">
                      <td className="px-4 py-3 text-slate-700">Toplam</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(report.cashRevenue)}</td>
                      <td className="px-4 py-3 text-right text-blue-700">{fmt(report.cardRevenue)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmt(report.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-red-500">
                        -{fmt(report.totalCost + (report.otherExpenses ?? 0) + report.stockPurchaseCost)}
                      </td>
                      <td className={`px-4 py-3 text-right ${report.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {report.grossProfit >= 0 ? '+' : ''}{fmt(report.grossProfit)}
                      </td>
                      <td className="px-4 py-3 text-right text-violet-600">
                        {report.dailySummaries.reduce((s, d) => s + (d.tableCount ?? 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {report.dailySummaries.reduce((s, d) => s + d.orderCount, 0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
