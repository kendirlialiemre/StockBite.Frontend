import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@stockbite/api-client';
import type { SubscriptionDto } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { Gift, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@stockbite/api-client';

type PackageDto = { id: string; name: string; price: number };

async function fetchPackages(): Promise<PackageDto[]> {
  const res = await apiClient.get('/admin/packages');
  return res.data;
}

async function fetchTenants(): Promise<{ id: string; name: string }[]> {
  const res = await apiClient.get('/admin/tenants');
  return res.data;
}

const STATUS_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Beklemede', cls: 'bg-yellow-100 text-yellow-700' },
  1: { label: 'Başarılı', cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'Başarısız', cls: 'bg-red-100 text-red-700' },
  3: { label: 'İptal', cls: 'bg-slate-100 text-slate-500' },
  4: { label: 'Ücretsiz', cls: 'bg-violet-100 text-violet-700' },
};

function GrantModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [tenantId, setTenantId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: tenants } = useQuery({ queryKey: ['admin', 'tenants-list'], queryFn: fetchTenants });
  const { data: packages } = useQuery({ queryKey: ['admin', 'packages'], queryFn: fetchPackages });

  const grantMutation = useMutation({
    mutationFn: () => adminService.grantPackage({
      tenantId,
      packageId,
      expiresAt: expiresAt || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      toast.success('Paket başarıyla verildi.');
      onClose();
    },
    onError: () => toast.error('Paket verilemedi.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !packageId) { toast.error('Tenant ve paket seçmelisiniz.'); return; }
    grantMutation.mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Ücretsiz Paket Ver</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı (Tenant)</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Seçin...</option>
              {tenants?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paket</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Seçin...</option>
              {packages?.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.price.toFixed(2)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi <span className="text-slate-400 font-normal">(boş = sınırsız)</span></label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="bg-emerald-50 rounded-lg px-4 py-3 text-sm text-emerald-700">
            Bu paket <strong>0 ₺</strong> olarak kaydedilecek ve ilgili modüller anında aktif edilecek.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">İptal</button>
            <button type="submit" disabled={grantMutation.isPending} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60">
              {grantMutation.isPending ? 'Veriliyor…' : 'Paketi Ver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtExpiry(iso: string | null) {
  if (!iso) return <span className="text-slate-400 text-xs">Sınırsız</span>;
  const d = new Date(iso);
  const expired = d < new Date();
  return <span className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-slate-600'}`}>{fmt(iso)}{expired ? ' ✗' : ''}</span>;
}

export function SubscriptionsPage() {
  const [showGrant, setShowGrant] = useState(false);
  const [search, setSearch] = useState('');

  const { data: subs, isLoading } = useQuery<SubscriptionDto[]>({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminService.getSubscriptions(),
  });

  const filtered = subs?.filter(s =>
    !search.trim() ||
    s.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    s.userName.toLowerCase().includes(search.toLowerCase()) ||
    s.packageName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Abonelikler</h1>
          <p className="text-sm text-slate-500 mt-1">Tüm paket satışları ve ücretsiz tahsisler.</p>
        </div>
        <button
          onClick={() => setShowGrant(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Gift size={16} />
          Ücretsiz Paket Ver
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-4 max-w-xs">
        <Search size={15} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Ara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm outline-none flex-1 text-slate-700 placeholder-slate-400 bg-transparent"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400">Henüz abonelik kaydı yok.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Kullanıcı</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Paket</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Tutar</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Satın Alma</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Bitiş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => {
                const st = STATUS_LABELS[s.status] ?? STATUS_LABELS[0];
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{s.tenantName}</p>
                      <p className="text-xs text-slate-400">{s.userName} · {s.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.packageName}</td>
                    <td className="px-4 py-3 font-bold">
                      {s.amount === 0
                        ? <span className="text-emerald-600">Ücretsiz</span>
                        : <span className="text-slate-900">₺{s.amount.toFixed(2)}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmt(s.purchasedAt)}</td>
                    <td className="px-4 py-3">{fmtExpiry(s.expiresAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showGrant && <GrantModal onClose={() => setShowGrant(false)} />}
    </div>
  );
}
