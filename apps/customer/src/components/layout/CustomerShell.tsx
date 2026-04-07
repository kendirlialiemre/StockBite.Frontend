import { useState, useEffect, useRef } from 'react';
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
  Timer,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ModuleType, orderService } from '@stockbite/api-client';
import { authService } from '@stockbite/api-client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import {
  getTriggeredAlarms, removeAlarm, addNotification, readNotifications,
  removeNotification, type FiredNotification,
} from '../../hooks/useTableAlarms';
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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const firedRef = useRef<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<FiredNotification[]>(readNotifications);

  function dismiss(orderId: string) {
    removeNotification(orderId);
    setNotifications(readNotifications());
  }

  function playBell() {
    try {
      const ctx = new AudioContext();

      // Her çan için birden fazla harmonik üretir — gerçekçi çan sesi
      function strike(startTime: number) {
        // Temel frekans + harmonikler (çan karakteristiği)
        const partials: [number, number][] = [
          [520, 0.5],   // temel
          [780, 0.25],  // 3. harmonik
          [1040, 0.15], // 2x
          [1560, 0.08], // yüksek parlama
          [2080, 0.04],
        ];

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, startTime);
        masterGain.gain.linearRampToValueAtTime(0.35, startTime + 0.01); // hızlı attack
        masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.2); // yavaş decay
        masterGain.connect(ctx.destination);

        partials.forEach(([freq, amp]) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          // Yüksek harmonikler daha hızlı söner
          g.gain.setValueAtTime(amp, startTime);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5 / (freq / 520));
          osc.connect(g);
          g.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + 2.5);
        });
      }

      // İki vuruş — ding-dong
      strike(ctx.currentTime);
      strike(ctx.currentTime + 0.55);
    } catch { /* ignore if audio not supported */ }
  }

  useQuery({
    queryKey: ['active-tables'],
    queryFn: () => orderService.getActiveTables(),
    enabled: hasModule(ModuleType.Tables),
    refetchInterval: 30000,
  });

  useEffect(() => {
    function check() {
      const triggered = getTriggeredAlarms();
      triggered.forEach(alarm => {
        const key = `${alarm.orderId}-${alarm.setAt}`;
        if (firedRef.current.has(key)) return;
        firedRef.current.add(key);
        // Remove alarm, add notification
        removeAlarm(alarm.orderId);
        const notif: FiredNotification = { orderId: alarm.orderId, tableName: alarm.tableName, firedAt: Date.now() };
        addNotification(notif);
        setNotifications(readNotifications());
        toast(`⏰ ${alarm.tableName} için alarm tetiklendi!`, { duration: 6000 });
        playBell();
      });
    }
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

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
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  if (notifOpen) {
                    notifications.forEach(n => removeNotification(n.orderId));
                    setNotifications([]);
                  }
                  setNotifOpen(o => !o);
                }}
                className="relative p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Bildirimler</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      Yeni bildirim yok.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.orderId} className="flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors">
                          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Timer size={15} className="text-orange-500" />
                          </div>
                          <Link
                            to="/tables"
                            onClick={() => { dismiss(n.orderId); setNotifOpen(false); }}
                            className="flex-1 min-w-0"
                          >
                            <p className="text-sm font-semibold text-slate-900 truncate">{n.tableName}</p>
                            <p className="text-xs text-orange-600 font-medium">Alarm tetiklendi</p>
                          </Link>
                          <button
                            onClick={() => dismiss(n.orderId)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
