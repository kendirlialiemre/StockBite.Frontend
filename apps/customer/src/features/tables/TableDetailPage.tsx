import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, menuService } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import type { OrderItemDto } from '@stockbite/api-client';
import { ArrowLeft, Plus, Trash2, X, Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function useElapsed(openedAt: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    function update() {
      const diff = Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [openedAt]);
  return elapsed;
}

export function TableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [search, setSearch] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['table-order', tableId],
    queryFn: () => orderService.getTableActiveOrder(tableId!),
    enabled: !!tableId,
  });

  const { data: menuCategories } = useQuery({
    queryKey: ['menu-categories-with-items'],
    queryFn: async () => {
      const cats = await menuService.getCategories();
      const items = await menuService.getItems();
      return cats.map(c => ({ ...c, items: items.filter(i => i.categoryId === c.id && i.isAvailable) }));
    },
    enabled: showAddItem,
  });

  const elapsed = useElapsed(order?.openedAt ?? new Date().toISOString());

  const addMutation = useMutation({
    mutationFn: ({ menuItemId }: { menuItemId: string }) =>
      orderService.addOrderItem(order!.id, { menuItemId, quantity: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-order', tableId] });
      qc.invalidateQueries({ queryKey: ['active-tables'] });
    },
    onError: () => toast.error('Ürün eklenemedi.'),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => orderService.removeOrderItem(order!.id, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-order', tableId] });
      qc.invalidateQueries({ queryKey: ['active-tables'] });
    },
    onError: () => toast.error('Ürün kaldırılamadı.'),
  });

  const closeMutation = useMutation({
    mutationFn: () => orderService.closeOrder(order!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tables'] });
      toast.success('Masa kapatıldı. Tutar günsonu cirosuna eklendi.');
      navigate('/tables');
    },
    onError: () => toast.error('Masa kapatılamadı.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(order!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tables'] });
      toast.success('Masa iptal edildi.');
      navigate('/tables');
    },
    onError: () => toast.error('Masa iptal edilemedi.'),
  });

  const allItems = menuCategories?.flatMap(c => c.items) ?? [];
  const filteredItems = search.trim()
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50"><Spinner /></div>
  );
  if (!order) return (
    <div className="p-6 text-center text-slate-400">Sipariş bulunamadı.</div>
  );

  function groupItems(items: OrderItemDto[]) {
    const map = new Map<string, { item: OrderItemDto; count: number }>();
    for (const item of items) {
      const existing = map.get(item.menuItemId);
      if (existing) existing.count += item.quantity;
      else map.set(item.menuItemId, { item, count: item.quantity });
    }
    return [...map.values()];
  }

  const grouped = groupItems(order.items);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/tables')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">{order.tableName}</h1>
          <p className="text-xs text-slate-400">{elapsed} • {order.items.length} kalem</p>
        </div>
        <div className="flex-shrink-0 bg-violet-50 rounded-xl px-3 py-1.5">
          <p className="text-violet-700 font-black text-sm">₺{order.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 p-4 max-w-xl mx-auto w-full space-y-2">
        {order.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Henüz ürün eklenmedi.</p>
            <p className="text-xs mt-1">Aşağıdaki düğme ile ürün ekleyin.</p>
          </div>
        ) : (
          grouped.map(({ item, count }) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-violet-600 text-xs font-black">{count}x</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.menuItemName}</p>
                <p className="text-xs text-slate-400">₺{item.unitPrice.toFixed(2)} / adet</p>
              </div>
              <p className="font-bold text-slate-700 text-sm flex-shrink-0">
                ₺{(item.unitPrice * count).toFixed(2)}
              </p>
              <button
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}

        {/* Add item button */}
        <button
          onClick={() => { setShowAddItem(true); setSearch(''); }}
          className="w-full bg-white border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl py-3 flex items-center justify-center gap-2 text-violet-500 hover:text-violet-700 text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Ürün Ekle
        </button>
      </div>

      {/* Footer actions */}
      <div className="bg-white border-t border-slate-100 p-4 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 font-medium text-sm">Toplam</span>
          <span className="text-2xl font-black text-slate-900">₺{order.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            İptal Et
          </button>
          <button
            onClick={() => setShowConfirmClose(true)}
            disabled={order.items.length === 0 || closeMutation.isPending}
            className="flex-[2] py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Masayı Kapat
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add Item Panel */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
            <button onClick={() => setShowAddItem(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
              <X size={20} />
            </button>
            <h2 className="font-bold text-slate-900 flex-1">Ürün Ekle</h2>
          </div>

          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <Search size={16} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Ürün ara…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuCategories === undefined ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Ürün bulunamadı.</p>
            ) : filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  addMutation.mutate({ menuItemId: item.id });
                  setShowAddItem(false);
                }}
                className="w-full flex items-center gap-3 bg-slate-50 hover:bg-violet-50 rounded-xl px-4 py-3 text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  )}
                </div>
                <span className="font-bold text-violet-700 text-sm flex-shrink-0">₺{item.price.toFixed(2)}</span>
                <Plus size={16} className="text-violet-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Close Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-2">Masayı Kapat</h2>
            <p className="text-slate-500 text-sm mb-1">
              <strong>{order.tableName}</strong> masası kapatılacak.
            </p>
            <div className="bg-violet-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-violet-500 font-medium">Toplam Tutar</p>
              <p className="text-2xl font-black text-violet-700">₺{order.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-violet-400 mt-1">Günsonu cirosuna eklenecek.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Geri
              </button>
              <button
                onClick={() => { setShowConfirmClose(false); closeMutation.mutate(); }}
                disabled={closeMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {closeMutation.isPending ? 'Kapatılıyor…' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
