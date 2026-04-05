
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  LogOut,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '@stockbite/api-client';
import toast from 'react-hot-toast';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    to: '/tenants',
    label: 'Tenants',
    icon: <Building2 size={18} />,
  },
  {
    to: '/users',
    label: 'Users',
    icon: <Users size={18} />,
  },
  {
    to: '/packages',
    label: 'Paketler',
    icon: <Package size={18} />,
  },
  {
    to: '/subscriptions',
    label: 'Abonelikler',
    icon: <CreditCard size={18} />,
  },
];

export function AdminShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // ignore errors during logout
    } finally {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-slate-900 text-slate-100">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">StockBite</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                ].join(' ')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-6 gap-2">
          <ChevronRight size={16} className="text-slate-400" />
          <span className="text-sm text-slate-500">
            Logged in as{' '}
            <span className="font-medium text-slate-700">
              {user?.firstName} {user?.lastName}
            </span>
          </span>
          <div className="ml-auto">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              SuperAdmin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
