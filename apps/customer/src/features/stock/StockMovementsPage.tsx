import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { stockService, Permissions } from '@stockbite/api-client';
import type { StockMovementType, CreateStockMovementRequest } from '@stockbite/api-client';
import { Button, Badge, Spinner, Modal, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

const MOVEMENT_LABELS: Record<number, string> = {
  0: 'Giriş',
  1: 'Çıkış',
  2: 'Düzeltme',
};

const MOVEMENT_VARIANTS: Record<number, 'success' | 'danger' | 'info'> = {
  0: 'success',
  1: 'danger',
  2: 'info',
};

type FormState = {
  stockItemId: string;
  type: string;
  quantity: string;
  unitCost: string;
  lowStockThreshold: string;
  note: string;
};

const emptyForm = (): FormState => ({
  stockItemId: '',
  type: '0',
  quantity: '',
  unitCost: '',
  lowStockThreshold: '',
  note: '',
});

export function StockMovementsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [filterItemId, setFilterItemId] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const { data: stockItems } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: () => stockService.getStockItems(),
  });

  const { data: pagedMovements, isLoading } = useQuery({
    queryKey: ['stock', 'movements', filterItemId, page],
    queryFn: () =>
      stockService.getMovements({
        stockItemId: filterItemId || undefined,
        page,
        pageSize: 10,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateStockMovementRequest) =>
      stockService.createMovement(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', 'movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock', 'items'] });
      toast.success('Hareket kaydedildi.');
      closeModal();
    },
    onError: () => toast.error('Hareket kaydedilemedi.'),
  });

  function closeModal() {
    setShowModal(false);
    setForm(emptyForm());
    setErrors({});
  }

  function validate() {
    const errs: Partial<FormState> = {};
    if (!form.stockItemId) errs.stockItemId = 'Bir kalem seçin.';
    if (
      !form.quantity ||
      isNaN(Number(form.quantity)) ||
      Number(form.quantity) <= 0
    )
      errs.quantity = 'Geçerli bir miktar girin.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    createMutation.mutate({
      stockItemId: form.stockItemId,
      type: Number(form.type) as StockMovementType,
      quantity: Number(form.quantity),
      unitCost: form.unitCost ? Number(form.unitCost) : undefined,
      lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
      note: form.note || undefined,
    });
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="space-y-3">
        <Link
          to="/stock"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Stok Kalemleri
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Stok Hareketleri</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tüm stok değişikliklerinin geçmişi.</p>
          </div>
          {hasPermission(Permissions.Stock.AddMovement) && (
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Hareket Ekle
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterItemId}
          onChange={(e) => { setFilterItemId(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tüm Kalemler</option>
          {stockItems?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden" style={{ minHeight: '480px' }}>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {!isLoading && (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Kalem
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tür
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Miktar
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Birim Maliyet
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Not
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedMovements?.items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    Henüz hareket kaydedilmemiş.
                  </td>
                </tr>
              )}
              {pagedMovements?.items.map((mov, idx) => (
                <tr
                  key={mov.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-emerald-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {mov.stockItemName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={MOVEMENT_VARIANTS[mov.type]}>
                      {MOVEMENT_LABELS[mov.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-900">
                    {mov.type === 1 ? '-' : '+'}{mov.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {mov.unitCost !== null ? `₺${mov.unitCost.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                    {mov.note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(mov.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagedMovements && pagedMovements.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Toplam {pagedMovements.totalCount} kayıt — Sayfa {pagedMovements.page} / {pagedMovements.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Önceki
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagedMovements.totalPages, p + 1))}
              disabled={page === pagedMovements.totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sonraki →
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Stok Hareketi Ekle"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Stok Kalemi <span className="text-red-500">*</span>
            </label>
            <select
              value={form.stockItemId}
              onChange={(e) => {
                setForm((p) => ({ ...p, stockItemId: e.target.value }));
                setErrors((p) => ({ ...p, stockItemId: undefined }));
              }}
              className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.stockItemId
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-300'
              }`}
            >
              <option value="">Kalem seçin</option>
              {stockItems?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unit})
                </option>
              ))}
            </select>
            {errors.stockItemId && (
              <p className="text-xs text-red-600 mt-1">{errors.stockItemId}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Hareket Türü
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">Giriş</option>
              <option value="1">Çıkış</option>
              <option value="2">Düzeltme</option>
            </select>
          </div>

          <Input
            label="Miktar"
            type="number"
            value={form.quantity}
            onChange={(e) => {
              setForm((p) => ({ ...p, quantity: e.target.value }));
              setErrors((p) => ({ ...p, quantity: undefined }));
            }}
            placeholder="Miktar girin"
            error={errors.quantity}
            required
          />

          {form.type === '0' && (
            <div>
              <Input
                label="Birim Maliyet (₺) *"
                type="number"
                value={form.unitCost}
                onChange={(e) =>
                  setForm((p) => ({ ...p, unitCost: e.target.value }))
                }
                placeholder="ör. 8.50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Aldığınız fiyatı girin — menü ürünlerinin maliyet ve kâr hesabında kullanılır.
              </p>
            </div>
          )}
          {form.type !== '0' && (
            <Input
              label="Birim Maliyet (₺)"
              type="number"
              value={form.unitCost}
              onChange={(e) =>
                setForm((p) => ({ ...p, unitCost: e.target.value }))
              }
              placeholder="Opsiyonel"
            />
          )}

          {form.type === '0' && (
            <Input
              label="Düşük Stok Uyarı Eşiği"
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))
              }
              placeholder="Opsiyonel (örn. 10)"
            />
          )}

          <Input
            label="Not"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Opsiyonel not"
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
