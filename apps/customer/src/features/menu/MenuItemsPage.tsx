import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, ToggleLeft, ToggleRight, ImagePlus, X, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService, stockService, apiClient } from '@stockbite/api-client';
import type { CreateMenuItemRequest, UpdateMenuItemRequest, IngredientRequest } from '@stockbite/api-client';
import { Button, Badge, Spinner, Modal, Input } from '@stockbite/ui';
import { Breadcrumb } from '../../components/ui/Breadcrumb';



type FormState = {
  name: string;
  description: string;
  price: string;
  costPrice: string;
  categoryId: string;
};

type IngredientRow = {
  stockItemId: string;
  quantity: string;
};

const emptyForm = (): FormState => ({
  name: '', description: '', price: '', costPrice: '', categoryId: '',
});

export function MenuItemsPage() {
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuService.getCategories(),
  });

  const { data: stockItems } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: () => stockService.getStockItems(),
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['menu', 'items', filterCategory],
    queryFn: () => menuService.getItems(filterCategory || undefined),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateMenuItemRequest) => menuService.createItem(req),
    onSuccess: async (created) => {
      if (imageFile) await uploadImage(created.id, imageFile);
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Ürün oluşturuldu.');
      closeModal();
    },
    onError: () => toast.error('Ürün oluşturulamadı.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateMenuItemRequest }) =>
      menuService.updateItem(id, req),
    onSuccess: async (_, { id }) => {
      if (imageFile) await uploadImage(id, imageFile);
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Ürün güncellendi.');
      closeModal();
    },
    onError: () => toast.error('Ürün güncellenemedi.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuService.toggleItemAvailability(id, isAvailable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu', 'items'] }),
    onError: () => toast.error('Durum güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
      toast.success('Ürün silindi.');
      setDeleteItem(null);
    },
    onError: () => toast.error('Ürün silinemedi.'),
  });

  async function uploadImage(itemId: string, file: File) {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiClient.post(`/menu/items/${itemId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      toast.error('Fotoğraf yüklenemedi.');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
    setIngredients([]);
    setImagePreview(null);
    setImageFile(null);
    setShowModal(true);
  }

  function openEdit(id: string) {
    const item = items?.find((i) => i.id === id);
    if (!item) return;
    setEditId(id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      costPrice: item.costPrice !== null ? String(item.costPrice) : '',
      categoryId: item.categoryId ?? '',
    });
    setIngredients(
      item.ingredients.map((ing) => ({
        stockItemId: ing.stockItemId,
        quantity: String(ing.quantity),
      }))
    );
    setErrors({});
    setImagePreview(item.imageUrl ?? null);
    setImageFile(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
    setIngredients([]);
    setImagePreview(null);
    setImageFile(null);
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { stockItemId: '', quantity: '' }]);
  }

  function removeIngredientRow(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateIngredient(idx: number, field: keyof IngredientRow, value: string) {
    setIngredients((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  }

  // Compute estimated cost from current ingredient rows + stock unit costs
  function computeCost(): number | null {
    if (ingredients.length === 0) return null;
    let total = 0;
    for (const row of ingredients) {
      if (!row.stockItemId || !row.quantity) return null;
      const si = stockItems?.find((s) => s.id === row.stockItemId);
      if (!si?.unitCost) return null;
      total += Number(row.quantity) * si.unitCost;
    }
    return total;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = 'Ürün adı zorunlu.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'Geçerli bir fiyat girin.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const validIngredients: IngredientRequest[] = ingredients
      .filter((row) => row.stockItemId && row.quantity && Number(row.quantity) > 0)
      .map((row) => ({ stockItemId: row.stockItemId, quantity: Number(row.quantity) }));

    if (editId) {
      const req: UpdateMenuItemRequest = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        categoryId: form.categoryId || undefined,
        ingredients: validIngredients,
      };
      updateMutation.mutate({ id: editId, req });
    } else {
      const req: CreateMenuItemRequest = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        categoryId: form.categoryId || undefined,
        ingredients: validIngredients,
      };
      createMutation.mutate(req);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || uploadingImage;
  const estimatedCost = computeCost();
  const estimatedProfit = estimatedCost !== null && form.price ? Number(form.price) - estimatedCost : null;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <Breadcrumb items={[
        { label: 'Menü Yönetimi', to: '/menu' },
        { label: 'Ürünler' },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Menü Ürünleri</h1>
          <p className="text-sm text-slate-500 mt-0.5">Yemek ve içecekleri yönetin.</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus size={16} /> Ürün Ekle
        </Button>
      </div>

      {/* Kategori filtresi */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            !filterCategory ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Tümü
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterCategory === cat.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16"><Spinner /></div>}
        {!isLoading && (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-12" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ürün</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Fiyat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Maliyet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-300 text-sm">
                    Henüz ürün eklenmemiş.
                  </td>
                </tr>
              )}
              {items?.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl!}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <ImagePlus size={14} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.ingredients.length > 0 && (
                        <span title={`${item.ingredients.length} malzeme`}>
                          <Package size={13} className="text-violet-400" />
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {categories?.find(c => c.id === item.categoryId)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">₺{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs">
                    {item.calculatedCost !== null ? (
                      <div>
                        <p className="text-slate-500">₺{item.calculatedCost.toFixed(2)}</p>
                        {item.estimatedProfit !== null && (
                          <p className={item.estimatedProfit >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                            {item.estimatedProfit >= 0 ? '+' : ''}₺{item.estimatedProfit.toFixed(2)} kâr
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isAvailable ? 'success' : 'neutral'}>
                      {item.isAvailable ? 'Mevcut' : 'Yok'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleMutation.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        {item.isAvailable ? <ToggleRight size={18} className="text-violet-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => openEdit(item.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteItem({ id: item.id, name: item.name })}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Ürünü Sil" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">{deleteItem?.name}</span> ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteItem(null)} disabled={deleteMutation.isPending}>
              İptal
            </Button>
            <Button
              variant="primary"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'Ürünü Düzenle' : 'Yeni Ürün'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fotoğraf */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">Ürün Fotoğrafı</label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all overflow-hidden flex-shrink-0"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus size={22} className="text-slate-300" />
                )}
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>JPEG, PNG veya WebP</p>
                <p>Maks. 5MB</p>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="flex items-center gap-1 text-red-400 hover:text-red-600"
                  >
                    <X size={12} /> Kaldır
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <Input
            label="Ürün Adı"
            value={form.name}
            onChange={(e) => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
            placeholder="ör. Adana Kebap"
            error={errors.name}
            required
          />
          <Input
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Kısa açıklama (opsiyonel)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Satış Fiyatı (₺)"
              type="number"
              value={form.price}
              onChange={(e) => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: undefined })); }}
              placeholder="0.00"
              error={errors.price}
              required
            />
            <Input
              label="Manuel Maliyet (₺)"
              type="number"
              value={form.costPrice}
              onChange={(e) => setForm(p => ({ ...p, costPrice: e.target.value }))}
              placeholder="0.00 (opsiyonel)"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Kategori</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Kategorisiz</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Malzemeler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Malzemeler (Stok Takibi)</label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                <Plus size={12} /> Malzeme Ekle
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="space-y-2 mb-2">
                {ingredients.map((row, idx) => {
                  const si = stockItems?.find((s) => s.id === row.stockItemId);
                  const rowCost = si?.unitCost && row.quantity
                    ? (Number(row.quantity) * si.unitCost).toFixed(2)
                    : null;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.stockItemId}
                        onChange={(e) => updateIngredient(idx, 'stockItemId', e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="">Stok seçin</option>
                        {stockItems?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.quantity} {s.unit}){s.unitCost ? ` — ₺${s.unitCost}/${s.unit}` : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                        placeholder="Miktar"
                        className="w-24 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      {si && <span className="text-xs text-slate-400 w-8">{si.unit}</span>}
                      {rowCost && <span className="text-xs text-slate-500 w-16 text-right">₺{rowCost}</span>}
                      <button type="button" onClick={() => removeIngredientRow(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Maliyet özeti */}
            {estimatedCost !== null && (
              <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Tahmini Maliyet</span>
                  <span className="font-medium">₺{estimatedCost.toFixed(2)}</span>
                </div>
                {estimatedProfit !== null && form.price && (
                  <div className={`flex justify-between font-semibold ${estimatedProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span>Net Kâr</span>
                    <span>{estimatedProfit >= 0 ? '+' : ''}₺{estimatedProfit.toFixed(2)}</span>
                  </div>
                )}
                <p className="text-xs text-slate-400">Geliş fiyatı girilmemiş malzemeler hesaba katılmaz.</p>
              </div>
            )}
            {ingredients.some((r) => r.stockItemId && stockItems?.find(s => s.id === r.stockItemId) && !stockItems?.find(s => s.id === r.stockItemId)?.unitCost) && (
              <p className="text-xs text-amber-500 mt-1">
                Bazı stok kalemlerinde geliş fiyatı yok. Stok hareketi eklerken "Birim Maliyet" girin.
              </p>
            )}
          </div>

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
