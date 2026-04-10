import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Banknote,
  CreditCard,
  UtensilsCrossed,
  Package,
  TableProperties,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderService, stockService, profitLossService, ModuleType } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 17) return 'İyi günler';
  return 'İyi akşamlar';
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

function QuickLink({ to, icon, label, color }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-all group`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
    </Link>
  );
}

export function DashboardPage() {
  const { user, hasModule } = useAuthStore();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

  const { data: daily, isLoading: reportLoading } = useQuery({
    queryKey: ['reports', 'daily', today],
    queryFn: () => profitLossService.getDailySummary(today),
    enabled: hasModule(ModuleType.ProfitLoss),
    refetchOnMount: 'always',
  });

  const lowStockItems =
    stockItems?.filter(
      (item) => item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold
    ) ?? [];

  const isLoading =
    (hasModule(ModuleType.Orders) && ordersLoading) ||
    (hasModule(ModuleType.Stock) && stockLoading) ||
    (hasModule(ModuleType.ProfitLoss) && reportLoading);

  const noModules =
    !hasModule(ModuleType.Orders) &&
    !hasModule(ModuleType.Stock) &&
    !hasModule(ModuleType.ProfitLoss) &&
    !hasModule(ModuleType.Menu) &&
    !hasModule(ModuleType.Tables);

  const totalRevenue = daily?.totalRevenue ?? 0;
  const cashShare = totalRevenue > 0 ? (daily?.cashRevenue ?? 0) / totalRevenue : 0;
  const cardShare = totalRevenue > 0 ? (daily?.cardRevenue ?? 0) / totalRevenue : 0;
  const subShare = totalRevenue > 0 ? (daily?.subscriptionRevenue ?? 0) / totalRevenue : 0;

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-500 py-8">
          <Spinner size="sm" />
          <span className="text-sm">Veriler yükleniyor…</span>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {hasModule(ModuleType.Orders) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Açık Siparişler
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {orders?.length ?? 0}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} className="text-blue-500" />
                  </div>
                </div>
                <Link
                  to="/orders"
                  className="mt-4 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  Siparişlere git <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {hasModule(ModuleType.ProfitLoss) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Bugünkü Gelir
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {fmt(daily?.totalRevenue ?? 0)}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-emerald-500" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  {daily?.orderCount ?? 0} sipariş tamamlandı
                </p>
              </div>
            )}

            {hasModule(ModuleType.ProfitLoss) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Net Kâr
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${(daily?.grossProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(daily?.grossProfit ?? 0)}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} className="text-violet-500" />
                  </div>
                </div>
                <Link
                  to="/reports"
                  className="mt-4 flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-medium"
                >
                  Raporu görüntüle <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {hasModule(ModuleType.Stock) && (
              <div className={`rounded-2xl border shadow-sm p-5 ${
                lowStockItems.length > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Düşük Stok
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {lowStockItems.length}
                    </p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    lowStockItems.length > 0 ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    <AlertTriangle size={20} className={lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-400'} />
                  </div>
                </div>
                {lowStockItems.length === 0 ? (
                  <p className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 size={12} /> Tüm stoklar yeterli
                  </p>
                ) : (
                  <Link
                    to="/stock"
                    className="mt-4 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Stoka git <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Revenue Breakdown + Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue breakdown */}
            {hasModule(ModuleType.ProfitLoss) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Bugünkü Gelir Dağılımı</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Banknote size={15} className="text-emerald-500" />
                      Nakit
                    </div>
                    <span className="font-semibold text-slate-800">{fmt(daily?.cashRevenue ?? 0)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${cashShare * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CreditCard size={15} className="text-blue-500" />
                      Kart
                    </div>
                    <span className="font-semibold text-slate-800">{fmt(daily?.cardRevenue ?? 0)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${cardShare * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BadgeCheck size={15} className="text-violet-500" />
                      Abonelik
                    </div>
                    <span className="font-semibold text-slate-800">{fmt(daily?.subscriptionRevenue ?? 0)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-violet-400 h-2 rounded-full transition-all"
                      style={{ width: `${subShare * 100}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Stok Alım Gideri</span>
                    <span className="font-semibold text-red-500">- {fmt(daily?.stockPurchaseCost ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Malzeme Maliyeti</span>
                    <span className="font-semibold text-red-500">- {fmt(daily?.totalCost ?? 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Hızlı Erişim</h3>
              <div className="space-y-2">
                {hasModule(ModuleType.Menu) && (
                  <QuickLink
                    to="/menu"
                    icon={<UtensilsCrossed size={18} className="text-orange-500" />}
                    label="Menü Yönetimi"
                    color="bg-orange-50"
                  />
                )}
                {hasModule(ModuleType.Tables) && (
                  <QuickLink
                    to="/tables"
                    icon={<TableProperties size={18} className="text-teal-500" />}
                    label="Masa Yönetimi"
                    color="bg-teal-50"
                  />
                )}
                {hasModule(ModuleType.Orders) && (
                  <QuickLink
                    to="/orders/new"
                    icon={<ShoppingCart size={18} className="text-blue-500" />}
                    label="Yeni Sipariş"
                    color="bg-blue-50"
                  />
                )}
                {hasModule(ModuleType.Stock) && (
                  <QuickLink
                    to="/stock"
                    icon={<Package size={18} className="text-violet-500" />}
                    label="Stok & Envanter"
                    color="bg-violet-50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Low stock items list */}
          {hasModule(ModuleType.Stock) && lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Düşük Stok Uyarıları</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        Eşik: {item.lowStockThreshold} {item.unit}
                      </span>
                      <span className="text-sm font-semibold text-amber-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockItems.length > 5 && (
                <Link
                  to="/stock"
                  className="mt-3 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
                >
                  +{lowStockItems.length - 5} ürün daha <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}

          {/* No modules state */}
          {noModules && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-violet-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Henüz modül aktif değil
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Mağazadan bir paket satın alarak modüllerinizi aktifleştirebilirsiniz.
              </p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
              >
                Mağazaya Git <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
