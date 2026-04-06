import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService, EXPENSE_CATEGORIES } from '@stockbite/api-client';
import type { CreateExpenseRequest } from '@stockbite/api-client';
import { Button, Spinner, Modal, Input } from '@stockbite/ui';

const CATEGORY_COLORS: Record<number, string> = {
  0: 'bg-blue-100 text-blue-700',
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-slate-100 text-slate-600',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [appliedFrom, setAppliedFrom] = useState(todayStr());
  const [appliedTo, setAppliedTo] = useState(todayStr());
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateExpenseRequest>({
    amount: 0,
    category: 0,
    description: '',
    date: todayStr(),
  });
  const [amountStr, setAmountStr] = useState('');

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', appliedFrom, appliedTo],
    queryFn: () => expenseService.getExpenses(appliedFrom, appliedTo),
    refetchOnMount: 'always',
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  const createMutation = useMutation({
    mutationFn: (req: CreateExpenseRequest) => expenseService.createExpense(req),
    onSuccess: () => {
      invalidateAll();
      toast.success('Gider eklendi.');
      setShowModal(false);
      setForm({ amount: 0, category: 0, description: '', date: todayStr() });
      setAmountStr('');
    },
    onError: () => toast.error('Gider eklenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Gider silindi.');
      setDeleteId(null);
    },
    onError: () => toast.error('Gider silinemedi.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { toast.error('Geçerli bir tutar girin.'); return; }
    if (!form.description.trim()) { toast.error('Açıklama zorunlu.'); return; }
    createMutation.mutate({ ...form, amount });
  }

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Giderler</h1>
          <p className="text-sm text-slate-500 mt-0.5">Maaş, kira, bakım ve diğer giderleri takip edin.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Gider Ekle
        </Button>
      </div>

      {/* Tarih filtresi */}
      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Başlangıç</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Bitiş</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <Button variant="primary" onClick={() => { setAppliedFrom(from); setAppliedTo(to); }}>
          Uygula
        </Button>
      </div>

      {/* Toplam */}
      {!isLoading && expenses && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Toplam Gider</p>
            <p className="text-xl font-bold text-red-600">
              -{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
          <p className="ml-auto text-sm text-slate-400">{expenses.length} kayıt</p>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && <div className="flex items-center justify-center py-16"><Spinner /></div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Açıklama</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tutar</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {expenses?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-300 text-sm">
                      Bu dönemde gider kaydı yok.
                    </td>
                  </tr>
                )}
                {expenses?.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(exp.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[exp.category] ?? CATEGORY_COLORS[4]}`}>
                        {exp.categoryLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{exp.description}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      -{exp.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(exp.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ekle Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Gider Ekle" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm(p => ({ ...p, category: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="ör. Ocak ayı maaşları"
            required
          />
          <Input
            label="Tutar (₺)"
            type="number"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0.00"
            required
          />
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={createMutation.isPending}>
              İptal
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Ekle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sil Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Gideri Sil" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Bu gider kaydını silmek istediğinizden emin misiniz?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>
              İptal
            </Button>
            <Button
              variant="primary"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
