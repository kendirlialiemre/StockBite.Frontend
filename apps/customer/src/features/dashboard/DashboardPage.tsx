
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { orderService, stockService, profitLossService, ModuleType } from '@stockbite/api-client';
import { StatCard, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

export function DashboardPage() {
  const { user, hasModule } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', { status: 0 }],
    queryFn: () => orderService.getOrders({ status: 0 }),
    enabled: hasModule(ModuleType.Orders),
  });

  const { data: stockItems, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: () => stockService.getStockItems(),
    enabled: hasModule(ModuleType.Stock),
  });

  const { data: dailySummary, isLoading: reportLoading } = useQuery({
    queryKey: ['reports', 'daily', today],
    queryFn: () => profitLossService.getDailySummary(today),
    enabled: hasModule(ModuleType.ProfitLoss),
  });

  const lowStockCount =
    stockItems?.filter(
      (item) =>
        item.lowStockThreshold !== null &&
        item.quantity <= item.lowStockThreshold
    ).length ?? 0;

  const isLoading =
    (hasModule(ModuleType.Orders) && ordersLoading) ||
    (hasModule(ModuleType.Stock) && stockLoading) ||
    (hasModule(ModuleType.ProfitLoss) && reportLoading);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().getHours() < 12 ? 'Günaydın' : new Date().getHours() < 17 ? 'İyi günler' : 'İyi akşamlar'},{' '}
          {user?.firstName}. Bugünkü özet aşağıda.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <Spinner size="sm" />
          <span className="text-sm">Loading data…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {hasModule(ModuleType.Orders) && (
            <StatCard
              title="Open Orders"
              value={orders?.length ?? 0}
              icon={<ShoppingCart size={20} />}
            />
          )}
          {hasModule(ModuleType.ProfitLoss) && dailySummary && (
            <>
              <StatCard
                title="Today's Revenue"
                value={`$${dailySummary.totalRevenue.toFixed(2)}`}
                icon={<DollarSign size={20} />}
              />
              <StatCard
                title="Today's Profit"
                value={`$${dailySummary.grossProfit.toFixed(2)}`}
                icon={<TrendingUp size={20} />}
              />
            </>
          )}
          {hasModule(ModuleType.Stock) && (
            <StatCard
              title="Low Stock Alerts"
              value={lowStockCount}
              icon={<AlertTriangle size={20} />}
              className={lowStockCount > 0 ? 'border-amber-300 bg-amber-50' : ''}
            />
          )}
        </div>
      )}

      {/* Quick tips if no modules */}
      {!hasModule(ModuleType.Orders) &&
        !hasModule(ModuleType.Stock) &&
        !hasModule(ModuleType.ProfitLoss) && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={20} className="text-violet-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Henüz modül aktif değil
            </h3>
            <p className="text-sm text-slate-500">
              Mağazadan bir paket satın alarak modüllerinizi aktifleştirebilirsiniz.
            </p>
          </div>
        )}

      {/* Today's info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Bugünün Tarihi</h3>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
