
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gift, AlertTriangle, Infinity } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, apiClient } from '@stockbite/api-client';
import { Badge, Spinner, Button } from '@stockbite/ui';
import { ModuleAssignmentPanel } from './ModuleAssignmentPanel';

type PackageDto = { id: string; name: string; price: number };
type ConflictResult = { hasConflict: boolean; currentExpiresAt: string | null; suggestedNewExpiresAt: string | null };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function GrantPackageModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [packageId, setPackageId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: packages } = useQuery<PackageDto[]>({
    queryKey: ['admin', 'packages'],
    queryFn: async () => { const r = await apiClient.get('/admin/packages'); return r.data; },
  });

  const { data: conflict, isFetching: conflictLoading } = useQuery<ConflictResult>({
    queryKey: ['admin', 'check-conflict', tenantId, packageId],
    queryFn: async () => {
      const r = await apiClient.get(`/admin/subscriptions/check-conflict?tenantId=${tenantId}&packageId=${packageId}`);
      return r.data;
    },
    enabled: !!packageId,
  });

  const grantMutation = useMutation({
    mutationFn: () => adminService.grantPackage({ tenantId, packageId, expiresAt: expiresAt || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenant-modules', tenantId] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      toast.success('Paket verildi.');
      onClose();
    },
    onError: () => toast.error('Paket verilemedi.'),
  });

  const isUnlimitedConflict = conflict?.hasConflict && conflict.currentExpiresAt === null;
  const isDateConflict = conflict?.hasConflict && conflict.currentExpiresAt !== null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Ücretsiz Paket Ver</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paket</label>
            <select value={packageId} onChange={e => setPackageId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Seçin...</option>
              {packages?.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.price.toFixed(2)})</option>)}
            </select>
          </div>

          {conflictLoading && packageId && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner size="sm" /> Çakışma kontrol ediliyor…
            </div>
          )}

          {!conflictLoading && isUnlimitedConflict && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <Infinity size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Bu tenant'ın bu pakete ait <strong>süresiz</strong> aktif modülleri var. Paket yine de eklenecek ancak mevcut süresiz erişim etkilenmez.
              </p>
            </div>
          )}

          {!conflictLoading && isDateConflict && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                <p>Bu tenant'ın mevcut paketi <strong>{fmt(conflict.currentExpiresAt!)}</strong> tarihine kadar aktif.</p>
                {conflict.suggestedNewExpiresAt && (
                  <p>Yeni paket bu tarihin üstüne eklenecek. Yeni bitiş tarihi: <strong>{fmt(conflict.suggestedNewExpiresAt)}</strong></p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş <span className="text-slate-400 font-normal">(boş = otomatik / sınırsız)</span></label>
            <input type="date" value={expiresAt.slice(0, 10)} onChange={e => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">İptal</button>
            <button onClick={() => { if (!packageId) { toast.error('Paket seçin'); return; } grantMutation.mutate(); }}
              disabled={grantMutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60">
              {grantMutation.isPending ? 'Veriliyor…' : 'Ver'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showGrantModal, setShowGrantModal] = useState(false);

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: () => adminService.getTenantById(id!),
    enabled: !!id,
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['admin', 'tenant-modules', id],
    queryFn: () => adminService.getTenantModules(id!),
    enabled: !!id,
  });

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      adminService.updateTenant(id!, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant updated');
    },
    onError: () => toast.error('Failed to update tenant'),
  });

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Tenant not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Tenants
      </button>

      {/* Tenant Info */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {tenant.name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-mono">
              {tenant.slug}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={tenant.isActive ? 'success' : 'neutral'}>
              {tenant.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <button
              onClick={() => setShowGrantModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Gift size={14} />
              Paket Ver
            </button>
            <Button
              variant={tenant.isActive ? 'danger' : 'primary'}
              size="sm"
              isLoading={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(!tenant.isActive)}
            >
              {tenant.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Tenant ID</dt>
            <dd className="font-mono text-slate-700 mt-0.5 text-xs">{tenant.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Created At</dt>
            <dd className="text-slate-700 mt-0.5">
              {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {showGrantModal && <GrantPackageModal tenantId={tenant.id} onClose={() => setShowGrantModal(false)} />}

      {/* Modules */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        {modulesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ModuleAssignmentPanel
            tenantId={tenant.id}
            modules={modules ?? []}
          />
        )}
      </div>
    </div>
  );
}
