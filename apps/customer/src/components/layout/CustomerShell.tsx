import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  User,
  Store,
  LogOut,
  Bell,
  Menu,
  ChefHat,
  QrCode,
  TableProperties,
  Receipt,
  Wallet,
} from 'lucide-react';
import { ModuleType } from '@stockbite/api-client';
import { authService } from '@stockbite/api-client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  moduleId?: number;
  ownerOnly?: boolean;
}

const mainNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/menu', label: 'Menü Yönetimi', icon: <UtensilsCrossed size={18} />, moduleId: ModuleType.Menu },
  { to: '/orders', label: 'Satış (POS)', icon: <ShoppingCart size={18} />, moduleId: ModuleType.Orders },
  { to: '/stock', label: 'Stok & Envanter', icon: <Package size={18} />, moduleId: ModuleType.Stock },
  { to: '/reports', label: 'Kar / Zarar', icon: <TrendingUp size={18} />, moduleId: ModuleType.ProfitLoss },
  { to: '/expenses', label: 'Giderler', icon: <Wallet size={18} />, moduleId: ModuleType.ProfitLoss },
  { to: '/store', label: 'Mağaza', icon: <Store size={18} /> },
  { to: '/menu/qr', label: 'QR Menü', icon: <QrCode size={18} />, moduleId: ModuleType.Menu },
  { to: '/tables', label: 'Masa Yönetimi', icon: <TableProperties size={18} />, moduleId: ModuleType.Tables },
];

const settingsNav: NavItem[] = [
  { to: '/my-subscriptions', label: 'Satın Almalarım', icon: <Receipt size={18} /> },
  { to: '/settings/employees', label: 'Çalışanlar', icon: <Users size={18} />, ownerOnly: true },
  { to: '/settings/profile', label: 'Profil', icon: <User size={18} /> },
];

export function CustomerShell() {
  const { user, logout, hasModule, setSubscribedModules } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.length);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    authService.getMyModules().then(setSubscribedModules).catch(() => {});
  }, []);

  async function handleLogout() {
    try { await authService.logout(); } catch { /* ignore */ } finally {
      logout();
      navigate('/login');
      toast.success('Çıkış yapıldı.');
    }
  }

  const visibleNav = mainNav.filter((item) =>
    item.moduleId === undefined ? true : hasModule(item.moduleId)
  );

  const visibleSettings = settingsNav.filter((item) =>
    item.ownerOnly ? user?.role === 'Owner' : true
  );

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const Sidebar = (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-100 h-full shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <ChefHat size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">StockBite</p>
            <p className="text-xs text-slate-400">Restoran Yönetimi</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/menu'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
              ].join(' ')
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

        {visibleSettings.length > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-100">
            {visibleSettings.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
                  ].join(' ')
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">{Sidebar}</div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex flex-col">{Sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Restaurant name + plan */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="font-semibold text-slate-800">{user?.firstName} {user?.lastName}</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              user?.role === 'Owner'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.role === 'Owner' ? 'Premium Plan' : user?.role}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Cart */}
            <Link
              to="/checkout"
              className="relative p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification bell */}
            <button className="relative p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">
              <Bell size={20} />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 leading-tight">{user?.role}</p>
              </div>
              <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
