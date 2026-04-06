import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Banknote, CreditCard, TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react';
import { profitLossService } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function fmt(val: number) {
  return `₺${val.toFixed(2)}`;
}

export function ReportsPage() {
  const today = new Date();
  const todayStr = formatDate(today);

  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [appliedFrom, setAppliedFrom] = useState(todayStr);
  const [appliedTo, setAppliedTo] = useState(todayStr);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['reports', 'range', appliedFrom, appliedTo],
    queryFn: () => profitLossService.getReportRange(appliedFrom, appliedTo),
    enabled: !!appliedFrom && !!appliedTo,
    refetchOnMount: 'always',
  });

  function handleApply() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const chartData = report?.dailySummaries.map((d) => ({
    date: d.date.split('T')[0],
    'Nakit Gelir': Number(d.cashRevenue.toFixed(2)),
    'Kart Gelir': Number(d.cardRevenue.toFixed(2)),
    'Stok Gideri': Number(d.stockPurchaseCost.toFixed(2)),
    'Net Kâr': Number(d.grossProfit.toFixed(2)),
  }));

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Kâr / Zarar Raporu</h1>
        <p className="text-sm text-slate-500 mt-0.5">Günlük gelir, gider ve kâr analizi</p>
      </div>

      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Başlangıç</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Bitiş</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={formatDate(today)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
          Uygula
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      )}
      {isError && (
        <div className="py-10 text-center text-sm text-red-500">Rapor verileri yüklenemedi.</div>
      )}

      {!isLoading && !isError && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Nakit Gelir', value: fmt(report.cashRevenue), icon: <Banknote size={18} className="text-green-600" />, bg: 'bg-green-100', text: 'text-slate-900' },
              { label: 'Kart Gelir', value: fmt(report.cardRevenue), icon: <CreditCard size={18} className="text-blue-600" />, bg: 'bg-blue-100', text: 'text-slate-900' },
              { label: 'Toplam Gelir', value: fmt(report.totalRevenue), icon: <TrendingUp size={18} className="text-indigo-600" />, bg: 'bg-indigo-100', text: 'text-slate-900' },
              { label: 'Stok Alım Gideri', value: `-${fmt(report.stockPurchaseCost)}`, icon: <Package size={18} className="text-orange-600" />, bg: 'bg-orange-100', text: 'text-slate-900' },
              { label: 'Malzeme Maliyeti', value: `-${fmt(report.totalCost)}`, icon: <TrendingDown size={18} className="text-red-500" />, bg: 'bg-red-100', text: 'text-slate-900' },
              { label: 'Diğer Giderler', value: `-${fmt(report.otherExpenses ?? 0)}`, icon: <TrendingDown size={18} className="text-pink-500" />, bg: 'bg-pink-100', text: 'text-slate-900' },
            ].map(({ label, value, icon, bg, text }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>{icon}</div>
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
                <p className={`text-base sm:text-lg font-bold ${text} mt-0.5 break-all`}>{value}</p>
              </div>
            ))}
            <div className={`rounded-xl border shadow-sm p-3 sm:p-4 ${report.grossProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${report.grossProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <ShoppingCart size={18} className={report.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
              </div>
              <p className="text-xs text-slate-500 leading-tight">Net Kâr</p>
              <p className={`text-base sm:text-lg font-bold mt-0.5 break-all ${report.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {report.grossProfit >= 0 ? '+' : ''}{fmt(report.grossProfit)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Günlük Gelir / Gider</h3>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }}
                    tickFormatter={(val: string) => { const d = new Date(val); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                  <Bar dataKey="Nakit Gelir" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Kart Gelir" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Stok Gideri" fill="#f97316" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Net Kâr" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Seçilen dönemde veri yok
              </div>
            )}
          </div>

          {/* Daily table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Günlük Detay</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tarih</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-green-600">Nakit</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600">Kart</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Toplam Gelir</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-orange-600">Stok Alım</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-red-500">Malzeme</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-pink-500">Giderler</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600">Net Kâr</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Sipariş</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailySummaries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">Bu dönemde veri yok</td>
                    </tr>
                  )}
                  {report.dailySummaries.map((day, idx) => (
                    <tr key={day.date} className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">
                        {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-700">{fmt(day.cashRevenue)}</td>
                      <td className="px-4 py-2.5 text-right text-blue-700">{fmt(day.cardRevenue)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-900">{fmt(day.totalRevenue)}</td>
                      <td className="px-4 py-2.5 text-right text-orange-600">-{fmt(day.stockPurchaseCost)}</td>
                      <td className="px-4 py-2.5 text-right text-red-500">-{fmt(day.totalCost)}</td>
                      <td className="px-4 py-2.5 text-right text-pink-500">-{fmt(day.otherExpenses)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${day.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {day.grossProfit >= 0 ? '+' : ''}{fmt(day.grossProfit)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{day.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
