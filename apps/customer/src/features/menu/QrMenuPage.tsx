import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import toast from 'react-hot-toast';
import { apiClient, menuService } from '@stockbite/api-client';
import type { MenuQrCodeDto } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { Plus, Trash2, RefreshCw, Download, ExternalLink, QrCode, Palette } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

async function fetchMySlug(): Promise<{ slug: string }> {
  const { data } = await apiClient.get('/me/info');
  return data;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function QrCard({
  qr,
  onDelete,
  onRegenerate,
  onEditDesign,
}: {
  qr: MenuQrCodeDto;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onEditDesign: (id: string) => void;
}) {
  const imgSrc = `${API_BASE}${qr.filePath}`;

  function handleDownload() {
    const a = document.createElement('a');
    a.href = imgSrc;
    a.download = `qr-${qr.label}.png`;
    a.click();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900">{qr.label}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Oluşturuldu: {fmt(qr.createdAt)}</p>
        </div>
        <button
          onClick={() => {
            if (confirm(`"${qr.label}" QR kodunu silmek istediğinize emin misiniz?`))
              onDelete(qr.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Sil"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center justify-center bg-slate-50 rounded-xl p-4">
        <img src={imgSrc} alt={qr.label} className="w-40 h-40 object-contain" />
      </div>

      <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-slate-500 truncate flex-1">{qr.publicUrl}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(qr.publicUrl); toast.success('Kopyalandı!'); }}
          className="text-xs font-semibold text-violet-600 hover:text-violet-700 whitespace-nowrap"
        >
          Kopyala
        </button>
      </div>

      <button
        onClick={() => onEditDesign(qr.id)}
        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors border border-violet-200 bg-violet-50/50"
      >
        <Palette size={14} />
        Tasarımı Düzenle
      </button>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-violet-600 px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors border border-slate-200"
        >
          <Download size={14} />
          İndir
        </button>
        <a
          href={qr.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-violet-600 px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors border border-slate-200"
        >
          <ExternalLink size={14} />
          Önizle
        </a>
        <button
          onClick={() => onRegenerate(qr.id)}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-amber-600 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors border border-slate-200"
          title="Yeniden oluştur"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}

export function QrMenuPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [label, setLabel] = useState('');
  const [showForm, setShowForm] = useState(searchParams.get('create') === '1');

  const { data: tenantInfo, isLoading: slugLoading } = useQuery({
    queryKey: ['me', 'info'],
    queryFn: fetchMySlug,
  });

  const { data: qrCodes, isLoading: codesLoading } = useQuery<MenuQrCodeDto[]>({
    queryKey: ['menu', 'qr-codes'],
    queryFn: () => menuService.getQrCodes(),
  });

  const createMutation = useMutation({
    mutationFn: () => menuService.createQrCode(label.trim(), window.location.origin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu', 'qr-codes'] });
      toast.success('QR kod oluşturuldu!');
      setLabel('');
      setShowForm(false);
    },
    onError: () => toast.error('QR kod oluşturulamadı.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuService.deleteQrCode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu', 'qr-codes'] });
      toast.success('QR kod silindi.');
    },
    onError: () => toast.error('Silinemedi.'),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => menuService.regenerateQrCode(id, window.location.origin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu', 'qr-codes'] });
      toast.success('QR kod yenilendi!');
    },
    onError: () => toast.error('Yenilenemedi.'),
  });

  if (slugLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: 'Menü Yönetimi', to: '/menu' },
        { label: 'QR Kodlarım' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QR Kodlarım</h1>
          <p className="text-sm text-slate-500 mt-1">
            Her QR kodun benzersiz bir URL'si vardır — masalara, menü kartlarına veya afişlere yapıştırın.
          </p>
        </div>
        <button
          onClick={() => navigate('/menu/template?next=qr')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-violet-200 text-sm"
        >
          <Plus size={16} />
          Yeni QR Kod
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Yeni QR Kod Oluştur</h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Etiket <span className="text-slate-400 font-normal">(örn. Masa 1, Bar, Bahçe)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Masa 1"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              onKeyDown={(e) => { if (e.key === 'Enter' && label.trim()) createMutation.mutate(); }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setLabel(''); }}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              İptal
            </button>
            <button
              onClick={() => { if (!label.trim()) return; createMutation.mutate(); }}
              disabled={!label.trim() || createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50"
            >
              {createMutation.isPending ? <Spinner /> : <QrCode size={15} />}
              Oluştur
            </button>
          </div>
        </div>
      )}

      {/* QR code list */}
      {codesLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : qrCodes?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <QrCode size={26} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Henüz QR kod yok</p>
          <p className="text-slate-400 text-xs mt-1">
            "Yeni QR Kod" butonuna basarak bir tane oluşturun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes?.map((qr) => (
            <QrCard
              key={qr.id}
              qr={qr}
              onDelete={(id) => deleteMutation.mutate(id)}
              onRegenerate={(id) => regenerateMutation.mutate(id)}
              onEditDesign={(id) => navigate(`/menu/template?qrId=${id}`)}
            />
          ))}
        </div>
      )}

      {tenantInfo?.slug && (
        <p className="text-xs text-slate-400 text-center">
          Menü base URL: <span className="font-mono">{window.location.origin}/m/{tenantInfo.slug}</span>
        </p>
      )}
    </div>
  );
}
