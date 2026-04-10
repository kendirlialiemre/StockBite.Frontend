import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PartyPopper, Plus, ChevronLeft, ChevronRight, Pencil, Trash2,
  Users, TrendingUp, TrendingDown, Banknote, X, Check, CreditCard, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService } from '@stockbite/api-client';
import type { EventDto, EventStatus, EventPaymentMethod } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

/* ─── Sabitler ──────────────────────────────────────────────── */
const EVENT_TYPES = ['Doğum Günü', 'Sünnet', 'Nikah', 'Nişan', 'Diğer'];
const STATUS_LABELS: Record<EventStatus, string> = { 0: 'Planlandı', 1: 'Tamamlandı', 2: 'İptal' };
const STATUS_COLORS: Record<EventStatus, string> = {
  0: 'bg-blue-100 text-blue-700',
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-red-100 text-red-600',
};

const MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                     'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmt(v: number) { return `₺${v.toFixed(2)}`; }
function dateLabel(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

/* ─── Form varsayılanları ──────────────────────────────────── */
interface FormState {
  personName: string; age: string; eventDate: string;
  adultCount: string; childCount: string; eventType: string;
  package: string; chargedAmount: string; cost: string;
  notes: string; status: EventStatus;
}
const emptyForm = (): FormState => ({
  personName: '', age: '', eventDate: new Date().toISOString().split('T')[0],
  adultCount: '0', childCount: '0', eventType: 'Doğum Günü',
  package: '', chargedAmount: '0', cost: '0', notes: '', status: 0,
});
function fromDto(e: EventDto): FormState {
  return {
    personName: e.personName, age: e.age?.toString() ?? '',
    eventDate: e.eventDate, adultCount: e.adultCount.toString(),
    childCount: e.childCount.toString(), eventType: e.eventType,
    package: e.package ?? '', chargedAmount: e.chargedAmount.toString(),
    cost: e.cost.toString(), notes: e.notes ?? '', status: e.status,
  };
}

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
function EventModal({
  event, onClose,
}: { event: EventDto | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(event ? fromDto(event) : emptyForm());
  const set = (k: keyof FormState, v: string | EventStatus) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        personName: form.personName.trim(),
        age: form.age ? parseInt(form.age) : null,
        eventDate: form.eventDate,
        adultCount: parseInt(form.adultCount) || 0,
        childCount: parseInt(form.childCount) || 0,
        eventType: form.eventType,
        package: form.package || null,
        chargedAmount: parseFloat(form.chargedAmount) || 0,
        cost: parseFloat(form.cost) || 0,
        notes: form.notes || null,
      };
      if (event) return eventService.update(event.id, { ...payload, status: form.status });
      return eventService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success(event ? 'Etkinlik güncellendi.' : 'Etkinlik oluşturuldu.');
      onClose();
    },
    onError: () => toast.error('Kaydedilemedi.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PartyPopper size={18} className="text-violet-600" />
            <h2 className="font-bold text-slate-900">{event ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Kişi ve tür */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Kişi Adı *</label>
              <input value={form.personName} onChange={e => set('personName', e.target.value)}
                placeholder="Arda" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Yaş</label>
              <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                placeholder="2" min={0} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Etkinlik Türü *</label>
              <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className="input-field">
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Tarih *</label>
              <input type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Misafir sayısı */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Yetişkin Sayısı</label>
              <input type="number" value={form.adultCount} onChange={e => set('adultCount', e.target.value)}
                min={0} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Çocuk Sayısı</label>
              <input type="number" value={form.childCount} onChange={e => set('childCount', e.target.value)}
                min={0} className="input-field" />
            </div>
          </div>

          {/* Paket */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Paket / Hizmet</label>
            <input value={form.package} onChange={e => set('package', e.target.value)}
              placeholder="Yemekli, Tam Paket, Pastasız…" className="input-field" />
          </div>

          {/* Ücret ve maliyet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Alınan Ücret (₺)</label>
              <input type="number" value={form.chargedAmount} onChange={e => set('chargedAmount', e.target.value)}
                min={0} step="0.01" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Maliyet (₺)</label>
              <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)}
                min={0} step="0.01" className="input-field" />
            </div>
          </div>

          {/* Net kâr önizleme */}
          {(parseFloat(form.chargedAmount) > 0 || parseFloat(form.cost) > 0) && (() => {
            const profit = (parseFloat(form.chargedAmount) || 0) - (parseFloat(form.cost) || 0);
            return (
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${profit >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <span className="text-sm font-semibold text-slate-600">Net Kâr</span>
                <span className={`text-lg font-black ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}{fmt(profit)}
                </span>
              </div>
            );
          })()}

          {/* Notlar */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Notlar</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Özel istekler, dekorasyon, pasta siparişi…"
              className="input-field resize-none" />
          </div>

          {/* Durum (sadece düzenleme modunda) */}
          {event && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Durum</label>
              <div className="flex gap-2">
                {([0, 1, 2] as EventStatus[]).map(s => (
                  <button key={s} onClick={() => set('status', s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.status === s ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            İptal
          </button>
          <button onClick={() => save.mutate()} disabled={save.isPending || !form.personName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {save.isPending ? <Spinner /> : <Check size={15} />}
            {event ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAYMENT MODAL
══════════════════════════════════════════ */
const PAYMENT_METHODS: { value: EventPaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 0, label: 'Nakit', icon: <Banknote size={18} />, color: 'text-emerald-600 border-emerald-400 bg-emerald-50' },
  { value: 1, label: 'Kart', icon: <CreditCard size={18} />, color: 'text-blue-600 border-blue-400 bg-blue-50' },
  { value: 2, label: 'Karma', icon: <Wallet size={18} />, color: 'text-violet-600 border-violet-400 bg-violet-50' },
];

function PaymentModal({ event, onClose }: { event: EventDto; onClose: () => void }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<EventPaymentMethod>(0);
  const [cashAmt, setCashAmt] = useState(event.chargedAmount.toString());
  const [cardAmt, setCardAmt] = useState('0');

  const total = event.chargedAmount;
  const cash = parseFloat(cashAmt) || 0;
  const card = parseFloat(cardAmt) || 0;
  const mixedValid = method !== 2 || Math.abs(cash + card - total) < 0.01;

  function handleMethodChange(m: EventPaymentMethod) {
    setMethod(m);
    if (m === 0) { setCashAmt(total.toString()); setCardAmt('0'); }
    if (m === 1) { setCashAmt('0'); setCardAmt(total.toString()); }
    if (m === 2) { setCashAmt('0'); setCardAmt('0'); }
  }

  const pay = useMutation({
    mutationFn: () => eventService.takePayment(event.id, {
      method,
      cashAmount: method === 0 ? total : cash,
      cardAmount: method === 1 ? total : card,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Ödeme alındı, etkinlik tamamlandı.');
      onClose();
    },
    onError: () => toast.error('Ödeme alınamadı.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Ödeme Al</h2>
            <p className="text-xs text-slate-400 mt-0.5">{event.personName} · {fmt(total)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Yöntem seçimi */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.value} onClick={() => handleMethodChange(pm.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  method === pm.value ? pm.color + ' border-2' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {pm.icon}
                {pm.label}
              </button>
            ))}
          </div>

          {/* Karma tutar girişi */}
          {method === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nakit (₺)</label>
                <input type="number" value={cashAmt} min={0} step="0.01"
                  onChange={e => setCashAmt(e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Kart (₺)</label>
                <input type="number" value={cardAmt} min={0} step="0.01"
                  onChange={e => setCardAmt(e.target.value)}
                  className="input-field" />
              </div>
              <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
                mixedValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                <span>Toplam</span>
                <span>{fmt(cash + card)} / {fmt(total)}</span>
              </div>
            </div>
          )}

          {/* Özet (nakit/kart için) */}
          {method !== 2 && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">{method === 0 ? 'Nakit' : 'Kart'} ile tahsil</span>
              <span className="text-lg font-black text-slate-900">{fmt(total)}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button onClick={() => pay.mutate()} disabled={pay.isPending || !mixedValid}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {pay.isPending ? <Spinner /> : <Check size={15} />}
            Ödemeyi Al
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANA SAYFA
══════════════════════════════════════════ */
export function EventsPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [modalEvent, setModalEvent] = useState<EventDto | 'new' | null>(null);
  const [paymentEvent, setPaymentEvent] = useState<EventDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<EventDto | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', year, month],
    queryFn: () => eventService.getAll(year, month),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Etkinlik silindi.'); },
    onError: () => toast.error('Silinemedi.'),
  });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Özet istatistikleri
  const totalRevenue = events.reduce((s, e) => s + e.chargedAmount, 0);
  const totalCost = events.reduce((s, e) => s + e.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalGuests = events.reduce((s, e) => s + e.adultCount + e.childCount, 0);

  // Takvim günlerini hesapla
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Pazar
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Pazartesi başlangıç

  const eventsByDay: Record<number, EventDto[]> = {};
  events.forEach(e => {
    const day = parseInt(e.eventDate.split('-')[2]);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Etkinlik Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Doğum günleri, organizasyonlar ve etkinlikleri takip edin</p>
        </div>
        <button onClick={() => setModalEvent('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={16} />
          Yeni Etkinlik
        </button>
      </div>

      {/* Ay navigasyonu */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-slate-900">{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* İstatistik kartları */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <PartyPopper size={16} className="text-violet-500" />
              <span className="text-xs text-slate-500">Etkinlik</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{events.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-500" />
              <span className="text-xs text-slate-500">Toplam Misafir</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{totalGuests}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote size={16} className="text-green-600" />
              <span className="text-xs text-slate-500">Toplam Gelir</span>
            </div>
            <p className="text-xl font-black text-green-700">{fmt(totalRevenue)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${totalProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {totalProfit >= 0
                ? <TrendingUp size={16} className="text-emerald-600" />
                : <TrendingDown size={16} className="text-red-500" />}
              <span className="text-xs text-slate-500">Net Kâr</span>
            </div>
            <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
            </p>
          </div>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!isLoading && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          {/* Takvim */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-bold text-slate-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Boş günler */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[56px] border-b border-r border-slate-50" />
              ))}
              {/* Günler */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = eventsByDay[day] ?? [];
                const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
                return (
                  <div key={day} className={`min-h-[56px] border-b border-r border-slate-50 p-1 flex flex-col ${isToday ? 'bg-violet-50' : ''}`}>
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                      {day}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {dayEvents.map(e => (
                        <button key={e.id} onClick={() => setModalEvent(e)}
                          className="text-left truncate rounded px-1 text-[9px] font-bold leading-tight py-0.5 w-full"
                          style={{ background: e.status === 1 ? '#d1fae5' : e.status === 2 ? '#fee2e2' : '#ede9fe', color: e.status === 1 ? '#065f46' : e.status === 2 ? '#991b1b' : '#5b21b6' }}>
                          {e.personName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <PartyPopper size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">Bu ay etkinlik yok</p>
                <p className="text-xs text-slate-300 mt-1">Yeni etkinlik eklemek için "+" butonuna tıklayın</p>
              </div>
            ) : (
              events
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                .map(e => (
                  <div key={e.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    {/* Üst satır */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {e.personName}{e.age != null ? ` (${e.age} yaş)` : ''}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status]}`}>
                            {STATUS_LABELS[e.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-violet-600 font-semibold">{e.eventType}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">{dateLabel(e.eventDate)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {e.status === 0 && (
                          <button onClick={() => setPaymentEvent(e)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                            <Banknote size={12} />
                            Ödeme Al
                          </button>
                        )}
                        <button onClick={() => setModalEvent(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Misafir + paket */}
                    <div className="flex gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users size={12} className="text-slate-400" />
                        <span>{e.adultCount} yetişkin</span>
                        {e.childCount > 0 && <span>· {e.childCount} çocuk</span>}
                      </div>
                      {e.package && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                          {e.package}
                        </span>
                      )}
                    </div>

                    {/* Finansal */}
                    <div className="pt-3 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span>Gelir: <span className="font-semibold text-green-700">{fmt(e.chargedAmount)}</span></span>
                          <span className="text-slate-300">·</span>
                          <span>Maliyet: <span className="font-semibold text-red-500">{fmt(e.cost)}</span></span>
                          {e.paymentMethod !== null && e.paymentMethod !== undefined && (
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {e.paymentMethod === 0 ? 'Nakit' : e.paymentMethod === 1 ? 'Kart' : `Karma (₺${e.cashAmount.toFixed(0)}N / ₺${e.cardAmount.toFixed(0)}K)`}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-black flex-shrink-0 ml-2 ${e.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {e.profit >= 0 ? '+' : ''}{fmt(e.profit)}
                        </span>
                      </div>
                    </div>

                    {/* Not */}
                    {e.notes && (
                      <p className="mt-2 text-xs text-slate-400 italic line-clamp-2">{e.notes}</p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {modalEvent !== null && (
        <EventModal
          event={modalEvent === 'new' ? null : modalEvent}
          onClose={() => setModalEvent(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentEvent !== null && (
        <PaymentModal
          event={paymentEvent}
          onClose={() => setPaymentEvent(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <ConfirmDialog
          title="Etkinliği Sil"
          message={`"${deleteConfirm.personName}" etkinliği silinsin mi? Bu işlem geri alınamaz.`}
          confirmLabel="Evet, Sil"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
