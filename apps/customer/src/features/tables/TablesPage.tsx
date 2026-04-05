import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, menuService } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import type { TableWithOrderDto, OrderItemDto } from '@stockbite/api-client';
import {
  Plus, UtensilsCrossed, X, Search, Trash2, ChevronRight, Timer, Banknote, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Live timer ──────────────────────────────────────────────────── */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatElapsed(openedAt: string, now: number) {
  const diff = Math.floor((now - new Date(openedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ─── Table Card ─────────────────────────────────────────────────── */
function TableCard({
  table,
  now,
  onClick,
}: {
  table: TableWithOrderDto;
  now: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-4 text-left hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all group flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-600 transition-colors flex-shrink-0">
          <UtensilsCrossed size={18} className="text-violet-600 group-hover:text-white transition-colors" />
        </div>
        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
          AÇIK
        </span>
      </div>

      {/* Name */}
      <p className="font-bold text-slate-900 text-sm truncate mb-1">{table.name}</p>

      {/* Timer */}
      <div className="flex items-center gap-1 text-xs text-violet-500 font-mono font-semibold mb-3">
        <Timer size={11} />
        <span>{formatElapsed(table.openedAt, now)}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span>{table.itemCount} ürün</span>
      </div>

      {/* Total */}
      <div className="mt-auto pt-3 border-t border-slate-100">
        <p className="text-lg font-black text-slate-900">
          ₺{(table.total ?? 0).toFixed(2)}
        </p>
        <p className="text-xs text-violet-600 font-semibold mt-1 group-hover:underline">
          Detay / Ödeme →
        </p>
      </div>
    </button>
  );
}

/* ─── Table Detail Modal ─────────────────────────────────────────── */
function TableDetailModal({
  table,
  now,
  onClose,
  onUpdated,
}: {
  table: TableWithOrderDto;
  now: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const qc = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['table-order', table.id],
    queryFn: () => orderService.getTableActiveOrder(table.id),
    refetchInterval: 10000,
  });

  const { data: menuCategories } = useQuery({
    queryKey: ['menu-categories-with-items'],
    queryFn: async () => {
      const [cats, items] = await Promise.all([menuService.getCategories(), menuService.getItems()]);
      return cats.map(c => ({ ...c, items: items.filter(i => i.categoryId === c.id && i.isAvailable) }));
    },
    enabled: showAddItem,
  });

  const addMutation = useMutation({
    mutationFn: ({ menuItemId }: { menuItemId: string }) =>
      orderService.addOrderItem(order!.id, { menuItemId, quantity: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-order', table.id] });
      onUpdated();
    },
    onError: () => toast.error('Ürün eklenemedi.'),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => orderService.removeOrderItem(order!.id, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-order', table.id] });
      onUpdated();
    },
    onError: () => toast.error('Ürün kaldırılamadı.'),
  });

  const closeMutation = useMutation({
    mutationFn: (paymentMethod: 0 | 1) => orderService.closeOrder(order!.id, paymentMethod),
    onSuccess: () => {
      onUpdated();
      toast.success('Ödeme alındı. Masa kapatıldı.');
      onClose();
    },
    onError: () => toast.error('Masa kapatılamadı.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(order!.id),
    onSuccess: () => {
      onUpdated();
      toast.success('Masa iptal edildi.');
      onClose();
    },
    onError: () => toast.error('İptal edilemedi.'),
  });

  function groupItems(items: OrderItemDto[]) {
    const map = new Map<string, { item: OrderItemDto; count: number }>();
    for (const item of items) {
      const ex = map.get(item.menuItemId);
      if (ex) ex.count += item.quantity;
      else map.set(item.menuItemId, { item, count: item.quantity });
    }
    return [...map.values()];
  }

  const allItems = menuCategories?.flatMap(c => c.items) ?? [];
  const filteredItems = (() => {
    let items = search.trim()
      ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
      : activeCatId
        ? (menuCategories?.find(c => c.id === activeCatId)?.items ?? [])
        : allItems;
    return items;
  })();

  const grouped = order ? groupItems(order.items) : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-full pointer-events-auto">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base truncate">{table.name}</h2>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                  AÇIK
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-violet-500 font-mono font-semibold">
                <Timer size={11} />
                <span>{formatElapsed(table.openedAt, now)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : grouped.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-6">Henüz ürün eklenmedi.</p>
            ) : (
              grouped.map(({ item, count }) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <span className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 text-xs font-black flex-shrink-0">
                    {count}x
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {item.menuItemName}
                  </span>
                  <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                    ₺{(item.unitPrice * count).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}

            {/* Add item */}
            <button
              onClick={() => { setShowAddItem(true); setSearch(''); }}
              className="w-full border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-xl py-2.5 flex items-center justify-center gap-2 text-violet-500 hover:text-violet-700 text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              Ürün Ekle
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500 font-medium">Toplam</span>
              <span className="text-2xl font-black text-slate-900">
                ₺{(order?.totalAmount ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                İptal Et
              </button>
              <button
                onClick={() => setShowConfirmClose(true)}
                disabled={!order || order.items.length === 0 || closeMutation.isPending}
                className="flex-[2] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Ödeme Al
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal — compact, category tabs */}
      {showAddItem && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setShowAddItem(false)} />
          <div className="fixed inset-x-4 bottom-4 z-[60] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[70vh] sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-sm flex-1">Ürün Ekle</h3>
              <button onClick={() => setShowAddItem(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                <Search size={14} className="text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Ürün ara…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setActiveCatId(null); }}
                  className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder-slate-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            {!search && menuCategories && (
              <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                <button
                  onClick={() => setActiveCatId(null)}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    activeCatId === null
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Tümü
                </button>
                {menuCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCatId(cat.id)}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      activeCatId === cat.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-1">
              {!menuCategories ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : filteredItems.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">Ürün bulunamadı.</p>
              ) : filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { addMutation.mutate({ menuItemId: item.id }); setShowAddItem(false); }}
                  className="w-full flex items-center gap-3 hover:bg-violet-50 rounded-xl px-3 py-2.5 text-left transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    )}
                  </div>
                  <span className="font-bold text-violet-700 text-sm flex-shrink-0">
                    ₺{item.price.toFixed(2)}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-violet-100 group-hover:bg-violet-600 flex items-center justify-center transition-colors flex-shrink-0">
                    <Plus size={13} className="text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Payment Method Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Ödeme Yöntemi</h3>
              <button onClick={() => setShowConfirmClose(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="bg-emerald-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-emerald-600 font-medium">{table.name} • Toplam Tutar</p>
              <p className="text-2xl font-black text-emerald-700">₺{(order?.totalAmount ?? 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowConfirmClose(false); closeMutation.mutate(0); }}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <Banknote size={28} className="text-green-600" />
                <span className="font-bold text-slate-800 text-sm">Nakit</span>
              </button>
              <button
                onClick={() => { setShowConfirmClose(false); closeMutation.mutate(1); }}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                <CreditCard size={28} className="text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">Kart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export function TablesPage() {
  const qc = useQueryClient();
  const now = useNow();
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableWithOrderDto | null>(null);

  const { data: tables, isLoading } = useQuery({
    queryKey: ['active-tables'],
    queryFn: () => orderService.getActiveTables(),
    refetchInterval: 30000,
  });

  const openMutation = useMutation({
    mutationFn: (n: string) => orderService.openTable(n),
    onSuccess: (table) => {
      qc.invalidateQueries({ queryKey: ['active-tables'] });
      setShowOpenModal(false);
      setName('');
      toast.success(`"${table.name}" açıldı.`);
      setSelectedTable(table);
    },
    onError: () => toast.error('Masa açılamadı.'),
  });

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['active-tables'] });
  }, [qc]);

  function handleOpen() {
    if (!name.trim()) { setNameError('Masa adı zorunludur.'); return; }
    setNameError('');
    openMutation.mutate(name.trim());
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Masa Yönetimi</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tables?.length ?? 0} açık masa</p>
        </div>
        <button
          onClick={() => { setShowOpenModal(true); setName(''); setNameError(''); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-violet-200"
        >
          <Plus size={16} />
          Masa Aç
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !tables?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <UtensilsCrossed size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Açık masa yok</p>
          <p className="text-slate-400 text-sm mt-1">Yeni masa açmak için "Masa Aç" düğmesine tıklayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              now={now}
              onClick={() => setSelectedTable(table)}
            />
          ))}
        </div>
      )}

      {/* Open Table Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Yeni Masa Aç</h2>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Masa Adı</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleOpen()}
              placeholder="örn. Masa 1, Bahçe VIP…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                nameError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-violet-500'
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleOpen}
                disabled={openMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {openMutation.isPending ? 'Açılıyor…' : 'Aç'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          now={now}
          onClose={() => setSelectedTable(null)}
          onUpdated={handleRefresh}
        />
      )}
    </div>
  );
}
