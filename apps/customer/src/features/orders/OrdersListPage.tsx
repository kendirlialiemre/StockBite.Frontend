import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, ChevronLeft, ChevronRight, Banknote, CreditCard, Calendar } from 'lucide-react';
import { orderService, Permissions } from '@stockbite/api-client';
import { Button, Badge, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

const STATUS_LABEL: Record<number, string> = { 0: 'Açık', 1: 'Kapatıldı', 2: 'İptal' };
const STATUS_VARIANT: Record<number, 'success' | 'neutral' | 'danger'> = { 0: 'success', 1: 'neutral', 2: 'danger' };
const PAYMENT_ICON: Record<number, JSX.Element> = {
  0: <Banknote size={14} className="text-green-600" />,
  1: <CreditCard size={14} className="text-blue-600" />,
};
const PAYMENT_LABEL: Record<number, string> = { 0: 'Nakit', 1: 'Kart' };

const PAGE_SIZE = 15;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function OrdersListPage() {
  const { hasPermission } = useAuthStore();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders', from, to],
    queryFn: () => orderService.getOrders({ from, to }),
  });

  const totalPages = Math.max(1, Math.ceil((orders?.length ?? 0) / PAGE_SIZE));
  const paginated = orders?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  function handleFromChange(val: string) {
    setFrom(val);
    setPage(1);
  }

  function handleToChange(val: string) {
    setTo(val);
    setPage(1);
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Siparişler</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders?.length ?? 0} sipariş</p>
        </div>
        {hasPermission(Permissions.Orders.Create) && (
          <Link to="/orders/new">
            <Button variant="primary" size="md">
              <Plus size={16} />
              Yeni Sipariş
            </Button>
          </Link>
        )}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar size={16} className="text-slate-400 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={e => handleFromChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-violet-400 transition-colors"
          />
          <span className="text-slate-400 text-sm">—</span>
          <input
            type="date"
            value={to}
            onChange={e => handleToChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-violet-400 transition-colors"
          />
        </div>
        <button
          onClick={() => { setFrom(todayStr()); setTo(todayStr()); setPage(1); }}
          className="text-xs font-semibold text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
        >
          Bugün
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        )}
        {isError && (
          <div className="py-10 text-center text-sm text-red-500">Siparişler yüklenemedi.</div>
        )}
        {!isLoading && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Masa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Durum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ödeme</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tutar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Açılış</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                        Bu tarih aralığında sipariş bulunamadı.
                      </td>
                    </tr>
                  )}
                  {paginated.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-violet-50 transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {order.tableName ?? 'Masasız'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[order.status]}>
                          {STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {order.paymentMethod != null ? (
                          <span className="flex items-center gap-1 text-slate-600">
                            {PAYMENT_ICON[order.paymentMethod]}
                            {PAYMENT_LABEL[order.paymentMethod]}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 font-medium">
                        ₺{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(order.openedAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye size={14} />
                            Görüntüle
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {orders?.length ?? 0} sipariş • Sayfa {page} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`dots-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                          page === p ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
