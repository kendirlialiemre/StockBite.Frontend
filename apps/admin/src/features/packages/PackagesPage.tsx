import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@stockbite/api-client';
import { Button, Spinner } from '@stockbite/ui';

type PackageModuleDto = { moduleType: number; moduleName: string };
type PackageDto = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number | null;
  isActive: boolean;
  modules: PackageModuleDto[];
};

const MODULE_NAMES: Record<number, string> = {
  1: 'Menü',
  2: 'Siparişler',
  3: 'Stok',
  4: 'Kar/Zarar',
  5: 'Masa Yönetimi',
  6: 'Abonelikler',
  7: 'Etkinlikler',
};

const ALL_MODULE_TYPES = [1, 2, 3, 4, 5, 6, 7];

async function fetchPackages(): Promise<PackageDto[]> {
  const res = await apiClient.get('/admin/packages');
  return res.data;
}

async function createPackage(data: {
  name: string;
  description: string;
  price: number;
  durationDays: number | null;
  moduleTypes: number[];
}): Promise<PackageDto> {
  const res = await apiClient.post('/admin/packages', data);
  return res.data;
}

async function updatePackage(
  id: string,
  data: {
    name: string;
    description: string;
    price: number;
    durationDays: number | null;
    isActive: boolean;
    moduleTypes: number[];
  }
): Promise<PackageDto> {
  const res = await apiClient.put(`/admin/packages/${id}`, data);
  return res.data;
}

interface PackageFormState {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  isActive: boolean;
  moduleTypes: number[];
}

const defaultForm: PackageFormState = {
  name: '',
  description: '',
  price: '',
  durationDays: '',
  isActive: true,
  moduleTypes: [],
};

interface PackageModalProps {
  title: string;
  initial?: PackageFormState;
  onClose: () => void;
  onSubmit: (form: PackageFormState) => void;
  isLoading: boolean;
}

function PackageModal({ title, initial = defaultForm, onClose, onSubmit, isLoading }: PackageModalProps) {
  const [form, setForm] = useState<PackageFormState>(initial);

  function toggleModule(mt: number) {
    setForm((prev) => ({
      ...prev,
      moduleTypes: prev.moduleTypes.includes(mt)
        ? prev.moduleTypes.filter((m) => m !== mt)
        : [...prev.moduleTypes, mt],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Paket adı gereklidir.'); return; }
    if (form.moduleTypes.length === 0) { toast.error('En az bir modül seçmelisiniz.'); return; }
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paket Adı</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Başlangıç Paketi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              placeholder="Paket açıklaması..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="199.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Süre (gün)</label>
              <input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Sınırsız"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Modüller</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MODULE_TYPES.map((mt) => (
                <label key={mt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleTypes.includes(mt)}
                    onChange={() => toggleModule(mt)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{MODULE_NAMES[mt]}</span>
                </label>
              ))}
            </div>
          </div>
          {'isActive' in initial && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Aktif</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="flex-1">İptal</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="flex-1">Kaydet</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PackagesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageDto | null>(null);

  const { data: packages, isLoading, isError } = useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: fetchPackages,
  });

  const createMutation = useMutation({
    mutationFn: (form: PackageFormState) =>
      createPackage({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        durationDays: form.durationDays ? parseInt(form.durationDays) : null,
        moduleTypes: form.moduleTypes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Paket oluşturuldu.');
      setShowCreate(false);
    },
    onError: () => toast.error('Paket oluşturulamadı.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PackageFormState }) =>
      updatePackage(id, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        durationDays: form.durationDays ? parseInt(form.durationDays) : null,
        isActive: form.isActive,
        moduleTypes: form.moduleTypes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Paket güncellendi.');
      setEditingPackage(null);
    },
    onError: () => toast.error('Paket güncellenemedi.'),
  });

  function handleToggleActive(pkg: PackageDto) {
    updateMutation.mutate({
      id: pkg.id,
      form: {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price.toString(),
        durationDays: pkg.durationDays?.toString() ?? '',
        isActive: !pkg.isActive,
        moduleTypes: pkg.modules.map((m) => m.moduleType),
      },
    });
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (isError) return <div className="p-6"><p className="text-red-600">Paketler yüklenemedi.</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paketler</h1>
          <p className="text-sm text-slate-500 mt-1">SaaS paketleri yönetin ve fiyatlandırın.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" />
          Yeni Paket
        </Button>
      </div>

      {(!packages || packages.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Package className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Henüz paket oluşturulmamış.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Paket Adı</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fiyat</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Süre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Modüller</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Durum</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{pkg.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {pkg.price === 0 ? <span className="text-emerald-600 font-bold">Ücretsiz</span> : `₺${pkg.price.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {pkg.durationDays ? `${pkg.durationDays} gün` : 'Sınırsız'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {pkg.modules.map((m) => (
                        <span key={m.moduleType} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {MODULE_NAMES[m.moduleType] ?? m.moduleName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {pkg.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingPackage(pkg)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Düzenle">
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className={`p-1.5 rounded-md transition-colors ${pkg.isActive ? 'text-emerald-500 hover:text-slate-400 hover:bg-slate-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                        title={pkg.isActive ? 'Pasife Al' : 'Aktife Al'}
                      >
                        {pkg.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <PackageModal title="Yeni Paket" onClose={() => setShowCreate(false)} onSubmit={(form) => createMutation.mutate(form)} isLoading={createMutation.isPending} />
      )}
      {editingPackage && (
        <PackageModal
          title="Paketi Düzenle"
          initial={{
            name: editingPackage.name,
            description: editingPackage.description,
            price: editingPackage.price.toString(),
            durationDays: editingPackage.durationDays?.toString() ?? '',
            isActive: editingPackage.isActive,
            moduleTypes: editingPackage.modules.map((m) => m.moduleType),
          }}
          onClose={() => setEditingPackage(null)}
          onSubmit={(form) => updateMutation.mutate({ id: editingPackage.id, form })}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
