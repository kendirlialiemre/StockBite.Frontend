import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@stockbite/api-client';
import { Button, Badge, Spinner } from '@stockbite/ui';
import { CreateTenantModal } from './CreateTenantModal';

export function TenantListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: tenants, isLoading, isError } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => adminService.getTenants(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateTenant(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant updated');
    },
    onError: () => toast.error('Failed to update tenant'),
  });

  const filtered = tenants?.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all restaurant tenants on the platform
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          New Tenant
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        )}
        {isError && (
          <div className="py-10 text-center text-sm text-red-500">
            Failed to load tenants. Please refresh.
          </div>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Slug
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    {search
                      ? 'No tenants match your search.'
                      : 'No tenants yet. Create your first one!'}
                  </td>
                </tr>
              )}
              {filtered?.map((tenant, idx) => (
                <tr
                  key={tenant.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-indigo-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {tenant.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {tenant.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.isActive ? 'success' : 'neutral'}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                      >
                        <Eye size={14} />
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({
                            id: tenant.id,
                            isActive: !tenant.isActive,
                          })
                        }
                      >
                        {tenant.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateTenantModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
