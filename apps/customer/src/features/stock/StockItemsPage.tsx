import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { stockService, Permissions } from '@stockbite/api-client';
import { Button, Badge, Spinner, Modal, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

type FormState = {
  name: string;
  unit: string;
  lowStockThreshold: string;
};

const emptyForm = (): FormState => ({
  name: '',
  unit: '',
  lowStockThreshold: '',
});

export function StockItemsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: () => stockService.getStockItems(),
  });

  const createMutation = useMutation({
    mutationFn: (f: FormState) =>
      stockService.createStockItem({
        name: f.name,
        unit: f.unit,
        lowStockThreshold: f.lowStockThreshold ? Number(f.lowStockThreshold) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'items'] });
      toast.success('Stok kalemi oluşturuldu.');
      closeModal();
    },
    onError: () => toast.error('Stok kalemi oluşturulamadı.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      stockService.updateStockItem(id, {
        name: f.name,
        unit: f.unit,
        lowStockThreshold: f.lowStockThreshold ? Number(f.lowStockThreshold) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'items'] });
      toast.success('Stok kalemi güncellendi.');
      closeModal();
    },
    onError: () => toast.error('Stok kalemi güncellenemedi.'),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
    setShowModal(true);
  }

  function openEdit(id: string) {
    const item = items?.find((i) => i.id === id);
    if (!item) return;
    setEditId(id);
    setForm({
      name: item.name,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : '',
    });
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
  }

  function validate() {
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = 'Ürün adı zorunlu.';
    if (!form.unit.trim()) errs.unit = 'Birim zorunlu.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, f: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockService.deleteStockItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'items'] });
      toast.success('Stok kalemi silindi.');
    },
    onError: () => toast.error('Stok kalemi silinemedi.'),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function isLowStock(item: { quantity: number; lowStockThreshold: number | null }) {
    return item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold;
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Stok Kalemleri</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Envanter seviyelerini takip edin.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/stock/movements"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Hareketler
          </Link>
          {hasPermission(Permissions.Stock.AddItem) && (
            <Button variant="primary" size="md" onClick={openCreate}>
              <Plus size={16} />
              Ekle
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {!isLoading && (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Kalem
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Miktar
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Birim
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Durum
                </th>
                {hasPermission(Permissions.Stock.EditItem) && (
                  <th className="px-4 py-3" />
                )}
              </tr>
            </thead>
            <tbody>
              {items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Henüz stok kalemi eklenmemiş.
                  </td>
                </tr>
              )}
              {items?.map((item, idx) => {
                const low = isLowStock(item);
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      low ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-amber-50 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {low && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />}
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      {item.lowStockThreshold !== null && (
                        <p className="text-xs text-slate-400 mt-0.5">Eşik: {item.lowStockThreshold} {item.unit}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {item.quantity} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-4 py-3">
                      {low ? (
                        <Badge variant="warning">Düşük Stok</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                    {hasPermission(Permissions.Stock.EditItem) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item.id)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`"${item.name}" silinsin mi?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editId ? 'Stok Kalemi Düzenle' : 'Stok Kalemi Ekle'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ürün Adı"
            value={form.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="ör. Zeytinyağı"
            error={errors.name}
            required
          />
          <Input
            label="Birim"
            value={form.unit}
            onChange={(e) => {
              setForm((p) => ({ ...p, unit: e.target.value }));
              setErrors((p) => ({ ...p, unit: undefined }));
            }}
            placeholder="ör. kg, L, adet"
            error={errors.unit}
            required
          />
          <Input
            label="Düşük Stok Uyarı Eşiği"
            type="number"
            value={form.lowStockThreshold}
            onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))}
            placeholder="ör. 5 (opsiyonel)"
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isMutating}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={isMutating}>
              {editId ? 'Kaydet' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
