import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@stockbite/api-client';
import type { MyPaymentDto } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { ShoppingBag, CheckCircle, XCircle, Clock, Gift, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

async function fetchMyPayments(): Promise<MyPaymentDto[]> {
  const { data } = await apiClient.get<MyPaymentDto[]>('/payments/mine');
  return data;
}

const STATUS_CONFIG = {
  0: { label: 'Beklemede', icon: <Clock size={13} className="text-yellow-500" />, cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Aktif', icon: <CheckCircle size={13} className="text-emerald-500" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { label: 'Başarısız', icon: <XCircle size={13} className="text-red-500" />, cls: 'bg-red-50 text-red-700 border-red-200' },
  3: { label: 'İptal', icon: <XCircle size={13} className="text-slate-400" />, cls: 'bg-slate-50 text-slate-500 border-slate-200' },
  4: { label: 'Ücretsiz', icon: <Gift size={13} className="text-violet-500" />, cls: 'bg-violet-50 text-violet-700 border-violet-200' },
} as const;

const PAGE_SIZE = 10;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isActive(p: MyPaymentDto) {
  if (p.status !== 1 && p.status !== 4) return false;
  if (!p.expiresAt) return true;
  return new Date(p.expiresAt) > new Date();
}

function ActiveCard({ p }: { p: MyPaymentDto }) {
  const days = p.expiresAt
    ? Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const urgent = days !== null && days < 14;

  return (
    <div className={`rounded-2xl border-2 p-5 ${urgent ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{p.packageName}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CONFIG[p.status].cls}`}>
              {STATUS_CONFIG[p.status].icon} {STATUS_CONFIG[p.status].label}
            </span>
          </div>
          {p.packageDescription && (
            <p className="text-xs text-slate-500 mt-1">{p.packageDescription}</p>
          )}
          <div className="mt-3">
            {p.expiresAt ? (
              <div className={`flex items-center gap-2 ${urgent ? 'text-amber-700' : 'text-emerald-700'}`}>
                {urgent && <AlertTriangle size={14} />}
                <span className="text-sm font-semibold">{fmt(p.expiresAt)} tarihinde sona eriyor</span>
                <span className="text-sm font-bold">({days} gün kaldı)</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-emerald-700">Süresiz aktif</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-slate-400 mb-0.5">Ödenen</p>
          {p.amount === 0
            ? <p className="text-lg font-black text-emerald-600">Ücretsiz</p>
            : <p className="text-lg font-black text-slate-900">₺{p.amount.toFixed(2)}</p>
          }
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ p }: { p: MyPaymentDto }) {
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG[0];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{p.packageName}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.cls}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-slate-400">
            <span>Satın alındı: {fmt(p.purchasedAt)}</span>
            {p.expiresAt && <span>Sona erdi: {fmt(p.expiresAt)}</span>}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {p.amount === 0
            ? <p className="text-base font-bold text-emerald-600">Ücretsiz</p>
            : <p className="text-base font-bold text-slate-900">₺{p.amount.toFixed(2)}</p>
          }
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
      <span>Toplam {total} kayıt — Sayfa {page} / {totalPages}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

type Tab = 'active' | 'history';

export function MySubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: payments, isLoading } = useQuery<MyPaymentDto[]>({
    queryKey: ['my-payments'],
    queryFn: fetchMyPayments,
  });

  const activeItems = payments?.filter(isActive) ?? [];
  const historyItems = payments?.filter((p) => !isActive(p)) ?? [];

  const pagedActive = activeItems.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const pagedHistory = historyItems.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'active', label: 'Aktif Paketler', count: activeItems.length },
    { id: 'history', label: 'Geçmiş', count: historyItems.length },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Paketlerim</h1>
        <p className="text-sm text-slate-400 mt-0.5">Aktif paketleriniz ve satın alma geçmişiniz</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div style={{ minHeight: '480px' }}>
          {tab === 'active' && (
            <div className="space-y-3">
              {pagedActive.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                    <ShoppingBag size={22} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Aktif paket yok</p>
                  <p className="text-slate-400 text-xs mt-1">Paket satın almak için Mağaza'ya gidin.</p>
                </div>
              ) : (
                <>
                  {pagedActive.map((p) => <ActiveCard key={p.id} p={p} />)}
                  <Pagination page={activePage} total={activeItems.length} onChange={setActivePage} />
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              {pagedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100">
                  <p className="text-slate-400 text-sm">Geçmiş kayıt yok.</p>
                </div>
              ) : (
                <>
                  {pagedHistory.map((p) => <HistoryCard key={p.id} p={p} />)}
                  <Pagination page={historyPage} total={historyItems.length} onChange={setHistoryPage} />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
