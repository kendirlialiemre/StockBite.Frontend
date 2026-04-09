import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, menuService } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import type { OrderItemDto } from '@stockbite/api-client';
import { ArrowLeft, Plus, X, Search, ChevronRight, Banknote, CreditCard, Layers } from 'lucide-react';
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
  const [mixedCash, setMixedCash] = useState('');
  const [mixedCard, setMixedCard] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['table-order', tableId],
    queryFn: () => orderService.getTableActiveOrder(tableId!),
    enabled: !!tableId,
    refetchInterval: 8000,
  });

  const { data: menuCategories } = useQuery({
    queryKey: ['menu-categories-with-items'],
    queryFn: async () => {
      const cats = await menuService.getCategories();
      const items = await menuService.getItems();
      return cats.map(c => ({ ...c, items: items.filter(i => i.categoryId === c.id && i.isAvailable) }));
    },
  });

  const elapsed = useElapsed(order?.openedAt ?? new Date().toISOString());

  const addMutation = useMutation({
    mutationFn: ({ menuItemId }: { menuItemId: string }) =>
      orderService.addOrderItem(order!.id, { menuItemId, quantity: 1 }),
    onMutate: async ({ menuItemId }) => {
      await qc.cancelQueries({ queryKey: ['table-order', tableId] });
      const previous = qc.getQueryData(['table-order', tableId]);
      const menuItem = menuCategories?.flatMap(c => c.items).find(i => i.id === menuItemId);
      if (menuItem) {
        qc.setQueryData(['table-order', tableId], (old: typeof order) => {
          if (!old) return old;
          const fakeItem = {
            id: `optimistic-${Date.now()}`,
            menuItemId,
            menuItemName: menuItem.name,
            unitPrice: menuItem.price,
            quantity: 1,
          };
          return {
            ...old,
            items: [...old.items, fakeItem],
            totalAmount: old.totalAmount + menuItem.price,
          };
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['table-order', tableId], ctx.previous);
      toast.error('Ürün eklenemedi.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['table-order', tableId] });
      qc.invalidateQueries({ queryKey: ['active-tables'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => orderService.removeOrderItem(order!.id, itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: ['table-order', tableId] });
      const previous = qc.getQueryData(['table-order', tableId]);
      qc.setQueryData(['table-order', tableId], (old: typeof order) => {
        if (!old) return old;
        const removed = old.items.find(i => i.id === itemId);
        return {
          ...old,
          items: old.items.filter(i => i.id !== itemId),
          totalAmount: old.totalAmount - (removed ? removed.unitPrice * removed.quantity : 0),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['table-order', tableId], ctx.previous);
      toast.error('Ürün kaldırılamadı.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['table-order', tableId] });
      qc.invalidateQueries({ queryKey: ['active-tables'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ paymentMethod, cashAmount, cardAmount }: { paymentMethod: 0 | 1 | 2; cashAmount?: number; cardAmount?: number }) =>
      orderService.closeOrder(order!.id, paymentMethod, cashAmount, cardAmount),
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
    const map = new Map<string, { item: OrderItemDto; ids: string[]; count: number }>();
    for (const item of items) {
      const existing = map.get(item.menuItemId);
      if (existing) { existing.count += item.quantity; existing.ids.push(item.id); }
      else map.set(item.menuItemId, { item, ids: [item.id], count: item.quantity });
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
          grouped.map(({ item, ids, count }) => (
            <div key={item.menuItemId} className="bg-white rounded-2xl border border-slate-100 flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.menuItemName}</p>
                <p className="text-xs text-slate-400">₺{item.unitPrice.toFixed(2)} / adet</p>
              </div>
              <p className="font-bold text-slate-700 text-sm flex-shrink-0">
                ₺{(item.unitPrice * count).toFixed(2)}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => removeMutation.mutate(ids[0])}
                  disabled={removeMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors font-bold text-base leading-none"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-black text-slate-700">{count}</span>
                <button
                  onClick={() => addMutation.mutate({ menuItemId: item.menuItemId })}
                  disabled={addMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
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

      {/* Payment Method Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-lg">Ödeme Yöntemi</h2>
              <button onClick={() => { setShowConfirmClose(false); setMixedCash(''); setMixedCard(''); }} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="bg-violet-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-violet-500 font-medium">{order.tableName} • Toplam Tutar</p>
              <p className="text-2xl font-black text-violet-700">₺{order.totalAmount.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => { setShowConfirmClose(false); closeMutation.mutate({ paymentMethod: 0 }); }}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <Banknote size={28} className="text-green-600" />
                <span className="text-sm font-bold text-slate-800">Nakit</span>
              </button>
              <button
                onClick={() => { setShowConfirmClose(false); closeMutation.mutate({ paymentMethod: 1 }); }}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                <CreditCard size={28} className="text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Kart</span>
              </button>
              <button
                onClick={() => { setMixedCash(''); setMixedCard(order.totalAmount.toFixed(2)); }}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all disabled:opacity-50"
              >
                <Layers size={28} className="text-violet-600" />
                <span className="text-sm font-bold text-slate-800">Karma</span>
              </button>
            </div>

            {(mixedCash !== '' || mixedCard !== '') && (() => {
              const cash = parseFloat(mixedCash) || 0;
              const card = parseFloat(mixedCard) || 0;
              const remaining = order.totalAmount - cash - card;
              const isValid = Math.abs(remaining) < 0.01;
              return (
                <div className="border border-violet-200 rounded-xl p-4 space-y-3 bg-violet-50">
                  <div className="flex items-center gap-3">
                    <Banknote size={16} className="text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 block mb-1">Nakit (₺)</label>
                      <input
                        type="number" min="0" step="0.01" value={mixedCash}
                        onChange={e => { setMixedCash(e.target.value); setMixedCard((order.totalAmount - (parseFloat(e.target.value) || 0)).toFixed(2)); }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-violet-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} className="text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 block mb-1">Kart (₺)</label>
                      <input
                        type="number" min="0" step="0.01" value={mixedCard}
                        onChange={e => { setMixedCard(e.target.value); setMixedCash((order.totalAmount - (parseFloat(e.target.value) || 0)).toFixed(2)); }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-violet-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {!isValid && (
                    <p className="text-xs text-red-500 text-center">
                      Kalan: ₺{remaining.toFixed(2)} — Toplam ₺{order.totalAmount.toFixed(2)} olmalı
                    </p>
                  )}
                  <button
                    onClick={() => { setShowConfirmClose(false); closeMutation.mutate({ paymentMethod: 2, cashAmount: cash, cardAmount: card }); }}
                    disabled={!isValid || closeMutation.isPending}
                    className="w-full py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    Masayı Kapat
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
