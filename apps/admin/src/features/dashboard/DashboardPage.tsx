
import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle } from 'lucide-react';
import { adminService } from '@stockbite/api-client';
import { StatCard, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => adminService.getTenants(),
  });

  const totalTenants = tenants?.length ?? 0;
  const activeTenants = tenants?.filter((t) => t.isActive).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back, {user?.firstName}. Here's what's happening on
          StockBite.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <Spinner size="sm" />
          <span className="text-sm">Loading stats…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            icon={<Building2 size={20} />}
          />
          <StatCard
            title="Active Tenants"
            value={activeTenants}
            icon={<CheckCircle size={20} />}
          />
          <StatCard
            title="Inactive Tenants"
            value={totalTenants - activeTenants}
            icon={<Building2 size={20} />}
          />
        </div>
      )}

      {/* Recent tenants */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Recent Tenants
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Last 5 tenants registered on the platform
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}
          {!isLoading && tenants && tenants.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No tenants yet. Create your first tenant to get started.
            </div>
          )}
          {!isLoading &&
            tenants
              ?.slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 5)
              .map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-slate-500">{tenant.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        tenant.isActive
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
