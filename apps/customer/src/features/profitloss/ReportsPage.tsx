import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { profitLossService } from '@stockbite/api-client';
import { StatCard, Spinner } from '@stockbite/ui';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function ReportsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(formatDate(thirtyDaysAgo));
  const [to, setTo] = useState(formatDate(today));
  const [appliedFrom, setAppliedFrom] = useState(from);
  const [appliedTo, setAppliedTo] = useState(to);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['reports', 'range', appliedFrom, appliedTo],
    queryFn: () => profitLossService.getReportRange(appliedFrom, appliedTo),
    enabled: !!appliedFrom && !!appliedTo,
  });

  function handleApply() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const chartData = report?.dailySummaries.map((d) => ({
    date: d.date.split('T')[0],
    Revenue: Number(d.totalRevenue.toFixed(2)),
    Cost: Number(d.totalCost.toFixed(2)),
    Profit: Number(d.grossProfit.toFixed(2)),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Profit & Loss Report
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Analyze revenue, cost and profitability over time
        </p>
      </div>

      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
            max={formatDate(today)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="py-10 text-center text-sm text-red-500">
          Failed to load report data.
        </div>
      )}

      {!isLoading && !isError && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={`$${report.totalRevenue.toFixed(2)}`}
              icon={<DollarSign size={20} />}
            />
            <StatCard
              title="Total Cost"
              value={`$${report.totalCost.toFixed(2)}`}
              icon={<TrendingDown size={20} />}
            />
            <StatCard
              title="Gross Profit"
              value={`$${report.grossProfit.toFixed(2)}`}
              icon={<TrendingUp size={20} />}
              className={
                report.grossProfit >= 0 ? '' : 'border-red-200 bg-red-50'
              }
            />
            <StatCard
              title="Total Orders"
              value={report.totalOrders}
              icon={<ShoppingCart size={20} />}
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Daily Revenue vs Cost
            </h3>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: string) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Cost" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Profit" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                No data available for the selected period
              </div>
            )}
          </div>

          {/* Daily summaries table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Daily Breakdown
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Revenue
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cost
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Profit
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.dailySummaries.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-slate-400 text-sm"
                    >
                      No data for this period
                    </td>
                  </tr>
                )}
                {report.dailySummaries.map((day, idx) => (
                  <tr
                    key={day.date}
                    className={`border-b border-slate-100 last:border-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-700">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-900">
                      ${day.totalRevenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-900">
                      ${day.totalCost.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium ${
                        day.grossProfit >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {day.grossProfit >= 0 ? '+' : ''}$
                      {day.grossProfit.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {day.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
