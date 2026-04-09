import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, Trash2, Clock, ChevronRight, ChevronLeft, CreditCard, Timer, Search, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { membershipService } from '@stockbite/api-client';
import type { MemberDetailDto, MemberSubscriptionDto as SubscriptionDto, SessionDto } from '@stockbite/api-client';
import { Button, Spinner, Modal, Input } from '@stockbite/ui';

export function MembershipsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  // mobile: 'list' | 'detail'
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showSession, setShowSession] = useState<SubscriptionDto | null>(null);
  const [editSub, setEditSub] = useState<SubscriptionDto | null>(null);
  const [editSession, setEditSession] = useState<SessionDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const [memberForm, setMemberForm] = useState({ name: '', phone: '', note: '' });
  const [subForm, setSubForm] = useState({ totalHoursStr: '', priceStr: '', note: '' });
  const [sessionForm, setSessionForm] = useState({ hoursStr: '', note: '' });
  const [editSubForm, setEditSubForm] = useState({ totalHoursStr: '', priceStr: '', note: '' });
  const [editSessionForm, setEditSessionForm] = useState({ hoursStr: '', note: '' });

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', appliedSearch],
    queryFn: () => membershipService.getMembers(appliedSearch || undefined),
    refetchOnMount: 'always',
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['member-detail', selectedMemberId],
    queryFn: () => membershipService.getMemberDetail(selectedMemberId!),
    enabled: !!selectedMemberId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    if (selectedMemberId) queryClient.invalidateQueries({ queryKey: ['member-detail', selectedMemberId] });
  };

  const createMemberMutation = useMutation({
    mutationFn: membershipService.createMember,
    onSuccess: (m) => {
      invalidate();
      toast.success('Üye eklendi.');
      setShowAddMember(false);
      setMemberForm({ name: '', phone: '', note: '' });
      setSelectedMemberId(m.id);
      setMobileView('detail');
    },
    onError: () => toast.error('Üye eklenemedi.'),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: membershipService.deleteMember,
    onSuccess: () => {
      invalidate();
      toast.success('Üye silindi.');
      setDeleteId(null);
      setSelectedMemberId(null);
      setMobileView('list');
    },
    onError: () => toast.error('Üye silinemedi.'),
  });

  const createSubMutation = useMutation({
    mutationFn: membershipService.createSubscription,
    onSuccess: () => {
      invalidate();
      toast.success('Abonelik eklendi.');
      setShowAddSub(false);
      setSubForm({ totalHoursStr: '', priceStr: '', note: '' });
    },
    onError: () => toast.error('Abonelik eklenemedi.'),
  });

  const sessionMutation = useMutation({
    mutationFn: membershipService.recordSession,
    onSuccess: () => {
      invalidate();
      toast.success('Seans kaydedildi.');
      setShowSession(null);
      setSessionForm({ hoursStr: '', note: '' });
    },
    onError: (e: Error) => toast.error(e.message || 'Seans kaydedilemedi.'),
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ id, ...req }: { id: string; totalHours: number; price: number; note?: string }) =>
      membershipService.updateSubscription(id, req),
    onSuccess: () => { invalidate(); toast.success('Paket güncellendi.'); setEditSub(null); },
    onError: (e: Error) => toast.error(e.message || 'Güncellenemedi.'),
  });

  const deleteSubMutation = useMutation({
    mutationFn: membershipService.deleteSubscription,
    onSuccess: () => { invalidate(); toast.success('Paket silindi.'); setDeleteSubId(null); },
    onError: () => toast.error('Paket silinemedi.'),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, ...req }: { id: string; hours: number; note?: string }) =>
      membershipService.updateSession(id, req),
    onSuccess: () => { invalidate(); toast.success('Seans güncellendi.'); setEditSession(null); },
    onError: (e: Error) => toast.error(e.message || 'Güncellenemedi.'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: membershipService.deleteSession,
    onSuccess: () => { invalidate(); toast.success('Seans silindi.'); setDeleteSessionId(null); },
    onError: () => toast.error('Seans silinemedi.'),
  });

  function selectMember(id: string) {
    setSelectedMemberId(id);
    setMobileView('detail');
  }

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberForm.name.trim()) { toast.error('İsim zorunlu.'); return; }
    createMemberMutation.mutate({ name: memberForm.name, phone: memberForm.phone || undefined, note: memberForm.note || undefined });
  }

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault();
    const totalHours = parseFloat(subForm.totalHoursStr);
    const price = parseFloat(subForm.priceStr);
    if (!totalHours || totalHours <= 0) { toast.error('Geçerli bir saat girin.'); return; }
    if (isNaN(price) || price < 0) { toast.error('Geçerli bir fiyat girin.'); return; }
    createSubMutation.mutate({ memberId: selectedMemberId!, totalHours, price, note: subForm.note || undefined });
  }

  function handleSession(e: React.FormEvent) {
    e.preventDefault();
    const hours = parseFloat(sessionForm.hoursStr);
    if (!hours || hours <= 0) { toast.error('Geçerli bir saat girin.'); return; }
    sessionMutation.mutate({ subscriptionId: showSession!.id, hours, note: sessionForm.note || undefined });
  }

  function openEditSub(sub: SubscriptionDto) {
    setEditSub(sub);
    setEditSubForm({ totalHoursStr: String(sub.totalHours), priceStr: String(sub.price), note: sub.note ?? '' });
  }

  function handleEditSub(e: React.FormEvent) {
    e.preventDefault();
    const totalHours = parseFloat(editSubForm.totalHoursStr);
    const price = parseFloat(editSubForm.priceStr);
    if (!totalHours || totalHours <= 0) { toast.error('Geçerli bir saat girin.'); return; }
    if (isNaN(price) || price < 0) { toast.error('Geçerli bir fiyat girin.'); return; }
    updateSubMutation.mutate({ id: editSub!.id, totalHours, price, note: editSubForm.note || undefined });
  }

  function openEditSession(s: SessionDto) {
    setEditSession(s);
    setEditSessionForm({ hoursStr: String(s.hours), note: s.note ?? '' });
  }

  function handleEditSession(e: React.FormEvent) {
    e.preventDefault();
    const hours = parseFloat(editSessionForm.hoursStr);
    if (!hours || hours <= 0) { toast.error('Geçerli bir saat girin.'); return; }
    updateSessionMutation.mutate({ id: editSession!.id, hours, note: editSessionForm.note || undefined });
  }

  const totalRemainingForDetail = detail?.subscriptions.reduce((s, sub) => s + sub.remainingHours, 0) ?? 0;

  const MemberList = (
    <div className="flex flex-col h-full">
      {/* Başlık */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h1 className="text-base font-bold text-slate-900">Abonelikler</h1>
          <p className="text-xs text-slate-400">Saat paketlerini yönet</p>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-violet-700 active:scale-95 transition-all"
        >
          <Plus size={15} /> Üye Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
              placeholder="İsim veya telefon..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
            />
          </div>
          <button
            onClick={() => setAppliedSearch(search)}
            className="px-3 py-2 text-sm bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 font-medium"
          >
            Ara
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="flex items-center justify-center py-16"><Spinner /></div>}
        {!isLoading && members?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Users size={36} className="mb-2" />
            <p className="text-sm">Henüz üye yok.</p>
          </div>
        )}
        {members?.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMember(m.id)}
            className="w-full text-left px-4 py-3.5 border-b border-slate-50 last:border-0 flex items-center gap-3 active:bg-violet-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{m.phone || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-sm font-bold ${m.totalRemainingHours > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                {m.totalRemainingHours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat
              </span>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const DetailPanel = (
    <div className="flex flex-col h-full">
      {/* Geri + başlık */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setMobileView('list')}
          className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 -ml-1"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-bold text-slate-900 truncate">{detail?.name ?? '...'}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {detailLoading && <div className="flex items-center justify-center py-16"><Spinner /></div>}
        {!detailLoading && detail && (
          <MemberDetail
            detail={detail}
            totalRemaining={totalRemainingForDetail}
            onDelete={() => setDeleteId(detail.id)}
            onAddSub={() => setShowAddSub(true)}
            onRecordSession={(sub) => { setShowSession(sub); setSessionForm({ hoursStr: '', note: '' }); }}
            onEditSub={openEditSub}
            onDeleteSub={(id) => setDeleteSubId(id)}
            onEditSession={openEditSession}
            onDeleteSession={(id) => setDeleteSessionId(id)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* DESKTOP: yan yana panel */}
      <div className="hidden sm:flex gap-4 flex-1 p-6 overflow-hidden">
        {/* Sol */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          {MemberList}
        </div>
        {/* Sağ */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          {!selectedMemberId ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Users size={40} className="mb-3" />
              <p className="text-sm">Detayları görmek için bir üye seçin.</p>
            </div>
          ) : DetailPanel}
        </div>
      </div>

      {/* MOBİLE: tek panel, list/detail geçişi */}
      <div className="sm:hidden flex-1 bg-white overflow-hidden flex flex-col">
        {mobileView === 'list' ? MemberList : DetailPanel}
      </div>

      {/* Üye Ekle Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Üye Ekle" size="sm">
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input label="İsim" value={memberForm.name} onChange={(e) => setMemberForm(p => ({ ...p, name: e.target.value }))} placeholder="Ahmet Yılmaz" required />
          <Input label="Telefon (opsiyonel)" value={memberForm.phone} onChange={(e) => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="05XX XXX XX XX" />
          <Input label="Not (opsiyonel)" value={memberForm.note} onChange={(e) => setMemberForm(p => ({ ...p, note: e.target.value }))} placeholder="..." />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowAddMember(false)}>İptal</Button>
            <Button type="submit" variant="primary" isLoading={createMemberMutation.isPending}>Ekle</Button>
          </div>
        </form>
      </Modal>

      {/* Abonelik Ekle Modal */}
      <Modal isOpen={showAddSub} onClose={() => setShowAddSub(false)} title="Saat Paketi Ekle" size="sm">
        <form onSubmit={handleAddSub} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Toplam Saat</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={subForm.totalHoursStr}
              onChange={(e) => setSubForm(p => ({ ...p, totalHoursStr: e.target.value }))}
              placeholder="ör. 30"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Ödenen Tutar (₺)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={subForm.priceStr}
              onChange={(e) => setSubForm(p => ({ ...p, priceStr: e.target.value }))}
              placeholder="ör. 500"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <Input label="Not (opsiyonel)" value={subForm.note} onChange={(e) => setSubForm(p => ({ ...p, note: e.target.value }))} placeholder="..." />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowAddSub(false)}>İptal</Button>
            <Button type="submit" variant="primary" isLoading={createSubMutation.isPending}>Ekle</Button>
          </div>
        </form>
      </Modal>

      {/* Seans Kaydet Modal */}
      <Modal isOpen={!!showSession} onClose={() => setShowSession(null)} title="Seans Kaydet" size="sm">
        {showSession && (
          <form onSubmit={handleSession} className="space-y-4">
            <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-700">
              Kalan saat: <span className="font-bold">{showSession.remainingHours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Düşülecek Saat</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max={showSession.remainingHours}
                value={sessionForm.hoursStr}
                onChange={(e) => setSessionForm(p => ({ ...p, hoursStr: e.target.value }))}
                placeholder="ör. 2"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <Input label="Not (opsiyonel)" value={sessionForm.note} onChange={(e) => setSessionForm(p => ({ ...p, note: e.target.value }))} placeholder="..." />
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => setShowSession(null)}>İptal</Button>
              <Button type="submit" variant="primary" isLoading={sessionMutation.isPending}>Kaydet</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Üye Sil Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Üyeyi Sil" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Bu üyeyi ve tüm abonelik geçmişini silmek istediğinizden emin misiniz?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleteMemberMutation.isPending}>İptal</Button>
            <Button variant="primary" isLoading={deleteMemberMutation.isPending}
              onClick={() => deleteId && deleteMemberMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Sil</Button>
          </div>
        </div>
      </Modal>

      {/* Paket Düzenle Modal */}
      <Modal isOpen={!!editSub} onClose={() => setEditSub(null)} title="Paketi Düzenle" size="sm">
        <form onSubmit={handleEditSub} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Toplam Saat</label>
            <input type="number" step="0.5" min="0.5" value={editSubForm.totalHoursStr}
              onChange={(e) => setEditSubForm(p => ({ ...p, totalHoursStr: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Ödenen Tutar (₺)</label>
            <input type="number" step="0.01" min="0" value={editSubForm.priceStr}
              onChange={(e) => setEditSubForm(p => ({ ...p, priceStr: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
          </div>
          <Input label="Not (opsiyonel)" value={editSubForm.note}
            onChange={(e) => setEditSubForm(p => ({ ...p, note: e.target.value }))} placeholder="..." />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditSub(null)}>İptal</Button>
            <Button type="submit" variant="primary" isLoading={updateSubMutation.isPending}>Kaydet</Button>
          </div>
        </form>
      </Modal>

      {/* Paket Sil Modal */}
      <Modal isOpen={!!deleteSubId} onClose={() => setDeleteSubId(null)} title="Paketi Sil" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Bu paketi ve tüm seans geçmişini silmek istediğinizden emin misiniz?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteSubId(null)} disabled={deleteSubMutation.isPending}>İptal</Button>
            <Button variant="primary" isLoading={deleteSubMutation.isPending}
              onClick={() => deleteSubId && deleteSubMutation.mutate(deleteSubId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Sil</Button>
          </div>
        </div>
      </Modal>

      {/* Seans Düzenle Modal */}
      <Modal isOpen={!!editSession} onClose={() => setEditSession(null)} title="Seansı Düzenle" size="sm">
        <form onSubmit={handleEditSession} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Saat</label>
            <input type="number" step="0.5" min="0.5" value={editSessionForm.hoursStr}
              onChange={(e) => setEditSessionForm(p => ({ ...p, hoursStr: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
          </div>
          <Input label="Not (opsiyonel)" value={editSessionForm.note}
            onChange={(e) => setEditSessionForm(p => ({ ...p, note: e.target.value }))} placeholder="..." />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditSession(null)}>İptal</Button>
            <Button type="submit" variant="primary" isLoading={updateSessionMutation.isPending}>Kaydet</Button>
          </div>
        </form>
      </Modal>

      {/* Seans Sil Modal */}
      <Modal isOpen={!!deleteSessionId} onClose={() => setDeleteSessionId(null)} title="Seansı Sil" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Bu seans silinirse saatler pakete geri eklenir. Devam edilsin mi?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteSessionId(null)} disabled={deleteSessionMutation.isPending}>İptal</Button>
            <Button variant="primary" isLoading={deleteSessionMutation.isPending}
              onClick={() => deleteSessionId && deleteSessionMutation.mutate(deleteSessionId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface MemberDetailProps {
  detail: MemberDetailDto;
  totalRemaining: number;
  onDelete: () => void;
  onAddSub: () => void;
  onRecordSession: (sub: SubscriptionDto) => void;
  onEditSub: (sub: SubscriptionDto) => void;
  onDeleteSub: (id: string) => void;
  onEditSession: (s: SessionDto) => void;
  onDeleteSession: (id: string) => void;
}

function MemberDetail({ detail, totalRemaining, onDelete, onAddSub, onRecordSession, onEditSub, onDeleteSub, onEditSession, onDeleteSession }: MemberDetailProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Profil + sil */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-base flex-shrink-0">
            {detail.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">{detail.name}</h2>
            {detail.phone && <p className="text-xs text-slate-400 mt-0.5">{detail.phone}</p>}
            {detail.note && <p className="text-xs text-slate-400 italic mt-0.5">{detail.note}</p>}
          </div>
        </div>
        <button onClick={onDelete} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className={`text-lg font-bold ${totalRemaining > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
            {totalRemaining.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">kalan saat</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-700">{detail.subscriptions.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">paket</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-700">{detail.subscriptions.reduce((s, sub) => s + sub.sessions.length, 0)}</p>
          <p className="text-xs text-slate-400 mt-0.5">seans</p>
        </div>
      </div>

      {/* Paket başlığı + ekle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Saat Paketleri</p>
        <button
          onClick={onAddSub}
          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
        >
          <Plus size={13} /> Paket Ekle
        </button>
      </div>

      {detail.subscriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-300">
          <CreditCard size={30} className="mb-2" />
          <p className="text-sm">Henüz paket yok.</p>
        </div>
      )}

      {detail.subscriptions.map((sub) => (
        <div key={sub.id} className="border border-slate-100 rounded-xl overflow-hidden">
          {/* Paket özeti */}
          <div className="bg-slate-50 px-3 py-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {sub.remainingHours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                    <span className="text-slate-400 font-normal"> / {sub.totalHours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {sub.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ · {new Date(sub.purchasedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {sub.remainingHours > 0 && (
                  <button onClick={() => onRecordSession(sub)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:border-violet-300 hover:text-violet-600 active:scale-95 transition-all">
                    <Timer size={12} /> Seans
                  </button>
                )}
                <button onClick={() => onEditSub(sub)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDeleteSub(sub.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (sub.remainingHours / sub.totalHours) * 100)}%` }}
              />
            </div>
          </div>

          {/* Seans geçmişi */}
          {sub.sessions.length > 0 && (
            <div className="divide-y divide-slate-50">
              {sub.sessions.map((s) => (
                <div key={s.id} className="px-3 py-2.5 flex items-center gap-2">
                  <Timer size={12} className="text-slate-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">
                      {new Date(s.sessionAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(s.sessionAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {s.note && <p className="text-xs text-slate-400 italic truncate">{s.note}</p>}
                  </div>
                  <span className="text-xs font-bold text-orange-600 flex-shrink-0">-{s.hours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat</span>
                  <button onClick={() => onEditSession(s)}
                    className="p-1 rounded-lg text-slate-300 hover:text-violet-500 hover:bg-violet-50 transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => onDeleteSession(s.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
