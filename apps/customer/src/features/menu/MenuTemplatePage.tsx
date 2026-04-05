import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Check, Upload, X, Palette, Type } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000';

/* ─────────────────────────────────────────────────────
   Renk yardımcıları
───────────────────────────────────────────────────── */

function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1e293b' : '#ffffff';
}

function withAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

/* ─────────────────────────────────────────────────────
   Tema arayüzü
───────────────────────────────────────────────────── */

interface Theme {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  logoSrc: string | null;
  tenantName: string;
}

/* ─────────────────────────────────────────────────────
   Demo verisi
───────────────────────────────────────────────────── */

const DEMO_CATEGORIES = ['Başlangıç', 'Ana Yemek', 'Tatlı'];
const DEMO_ITEMS = [
  { name: 'Mercimek Çorbası', desc: 'Geleneksel tarif', price: '45.00' },
  { name: 'Patlıcan Salatası', desc: 'Közlenmiş, taze', price: '55.00' },
  { name: 'Izgara Köfte', desc: 'Yanında pilav ile', price: '120.00' },
];

/* ─────────────────────────────────────────────────────
   Logo / baş harf bileşeni
───────────────────────────────────────────────────── */

function LogoOrInitial({
  logoSrc,
  name,
  size,
  bg,
}: {
  logoSrc: string | null;
  name: string;
  size: string;
  bg: string;
}) {
  const tc = contrastText(bg);
  if (logoSrc) {
    return (
      <div className={`${size} rounded-xl overflow-hidden flex-shrink-0`}>
        <img src={logoSrc} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${size} rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm`}
      style={{ background: bg, color: tc }}
    >
      {name[0]?.toUpperCase() ?? 'R'}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Canlı önizleme bileşenleri
───────────────────────────────────────────────────── */

function MinimalLive({ theme }: { theme: Theme }) {
  const onPrimary = contrastText(theme.primaryColor);
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: theme.bgColor, color: theme.textColor }}
    >
      {/* Header */}
      <div className="pt-4 pb-3 flex flex-col items-center gap-1.5 shadow-sm" style={{ background: '#fff' }}>
        <LogoOrInitial
          logoSrc={theme.logoSrc}
          name={theme.tenantName}
          size="w-10 h-10"
          bg={theme.primaryColor}
        />
        <span className="text-[9px] font-black" style={{ color: '#1e293b' }}>
          {theme.tenantName}
        </span>
        <span className="text-[6px]" style={{ color: '#94a3b8' }}>
          Dijital Menü
        </span>
      </div>
      {/* Tabs */}
      <div className="py-1.5 px-2 flex gap-1 justify-center shadow-sm" style={{ background: '#fff' }}>
        {DEMO_CATEGORIES.map((cat, i) => (
          <span
            key={cat}
            className="rounded-full px-2 py-0.5 text-[6px] font-bold flex-shrink-0"
            style={
              i === 0
                ? { background: theme.primaryColor, color: onPrimary }
                : { background: withAlpha(theme.primaryColor, 0.1), color: theme.primaryColor }
            }
          >
            {cat}
          </span>
        ))}
      </div>
      {/* Items */}
      <div className="flex-1 px-2 pt-2 space-y-1.5 overflow-hidden">
        {DEMO_ITEMS.map(item => (
          <div
            key={item.name}
            className="bg-white rounded-xl border px-2 py-1.5 flex items-center justify-between shadow-sm"
            style={{ borderColor: withAlpha(theme.primaryColor, 0.12) }}
          >
            <div>
              <span className="text-[6.5px] font-bold block" style={{ color: theme.textColor }}>
                {item.name}
              </span>
              <span className="text-[5px]" style={{ color: withAlpha(theme.textColor, 0.6) }}>
                {item.desc}
              </span>
            </div>
            <span className="text-[6.5px] font-black" style={{ color: theme.primaryColor }}>
              ₺{item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModernLive({ theme }: { theme: Theme }) {
  const onPrimary = contrastText(theme.primaryColor);
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: theme.bgColor, color: theme.textColor }}
    >
      {/* Header gradient */}
      <div
        className="pt-4 pb-3 flex flex-col items-center gap-1.5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.bgColor} 100%)` }}
      >
        <LogoOrInitial
          logoSrc={theme.logoSrc}
          name={theme.tenantName}
          size="w-10 h-10"
          bg={theme.primaryColor}
        />
        <span className="text-[9px] font-black text-white">{theme.tenantName}</span>
        <span className="text-[6px]" style={{ color: withAlpha('#ffffff', 0.6) }}>
          Dijital Menü
        </span>
      </div>
      {/* Tabs */}
      <div
        className="py-1.5 px-2 flex gap-1 justify-center"
        style={{
          background: withAlpha(theme.bgColor, 0.95),
          borderBottom: `1px solid ${withAlpha('#ffffff', 0.05)}`,
        }}
      >
        {DEMO_CATEGORIES.map((cat, i) => (
          <span
            key={cat}
            className="rounded-lg px-2 py-0.5 text-[6px] font-bold flex-shrink-0"
            style={
              i === 0
                ? { background: theme.primaryColor, color: onPrimary }
                : { background: withAlpha('#ffffff', 0.06), color: withAlpha('#ffffff', 0.5) }
            }
          >
            {cat}
          </span>
        ))}
      </div>
      {/* Grid items */}
      <div className="flex-1 px-2 pt-2 grid grid-cols-2 gap-1.5 overflow-hidden">
        {DEMO_ITEMS.map(item => (
          <div
            key={item.name}
            className="rounded-xl overflow-hidden flex flex-col"
            style={{
              background: withAlpha('#ffffff', 0.05),
              border: `1px solid ${withAlpha('#ffffff', 0.08)}`,
            }}
          >
            <div
              className="h-8 flex items-center justify-center"
              style={{ background: withAlpha(theme.primaryColor, 0.15) }}
            >
              <span className="text-[10px] font-black" style={{ color: withAlpha(theme.primaryColor, 0.5) }}>
                {item.name[0]}
              </span>
            </div>
            <div className="p-1.5">
              <p className="text-[5.5px] font-bold leading-tight" style={{ color: theme.textColor }}>
                {item.name}
              </p>
              <p className="text-[5px] leading-tight mt-0.5" style={{ color: withAlpha(theme.textColor, 0.55) }}>
                {item.desc}
              </p>
              <p className="text-[6px] font-black mt-0.5" style={{ color: theme.primaryColor }}>
                ₺{item.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassicLive({ theme }: { theme: Theme }) {
  const onPrimary = contrastText(theme.primaryColor);
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: theme.bgColor, color: theme.textColor }}
    >
      {/* Header */}
      <div
        className="pt-3 pb-3 flex flex-col items-center gap-1 text-center"
        style={{
          background: `linear-gradient(180deg, ${theme.primaryColor} 0%, ${withAlpha(theme.primaryColor, 0.85)} 100%)`,
        }}
      >
        <span
          className="text-[5px] tracking-[0.25em] uppercase font-medium"
          style={{ color: withAlpha(onPrimary, 0.7) }}
        >
          Hoş Geldiniz
        </span>
        {theme.logoSrc ? (
          <div
            className="w-9 h-9 rounded-xl overflow-hidden border-2 shadow-lg my-0.5"
            style={{ borderColor: withAlpha(onPrimary, 0.3) }}
          >
            <img src={theme.logoSrc} alt={theme.tenantName} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <span className="text-[9px] font-black" style={{ fontFamily: 'Georgia, serif', color: onPrimary }}>
          {theme.tenantName}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-px w-5" style={{ background: withAlpha(onPrimary, 0.3) }} />
          <span className="text-[8px]" style={{ color: withAlpha(onPrimary, 0.6) }}>
            ✦
          </span>
          <div className="h-px w-5" style={{ background: withAlpha(onPrimary, 0.3) }} />
        </div>
      </div>
      {/* Tabs */}
      <div
        className="py-1.5 px-2 flex justify-center"
        style={{ background: withAlpha(theme.primaryColor, 0.85) }}
      >
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {DEMO_CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-lg text-[6px] font-bold flex-shrink-0"
              style={
                i === 0
                  ? { background: theme.bgColor, color: theme.primaryColor }
                  : { color: withAlpha(onPrimary, 0.6) }
              }
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
      {/* Items */}
      <div className="flex-1 px-2 pt-2 space-y-1.5 overflow-hidden">
        {DEMO_ITEMS.map(item => (
          <div
            key={item.name}
            className="rounded-xl overflow-hidden flex shadow-sm"
            style={{ background: '#fff', border: `1px solid ${withAlpha(theme.primaryColor, 0.12)}` }}
          >
            <div
              className="w-6 flex-shrink-0 flex items-center justify-center"
              style={{ background: withAlpha(theme.primaryColor, 0.07) }}
            >
              <span className="text-[9px] font-black" style={{ color: theme.primaryColor }}>
                {item.name[0]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 px-1.5 py-1.5 flex-1">
              <div>
                <span className="text-[6px] font-bold block" style={{ color: theme.textColor }}>
                  {item.name}
                </span>
                <span className="text-[5px]" style={{ color: withAlpha(theme.textColor, 0.55) }}>
                  {item.desc}
                </span>
              </div>
              <span
                className="text-[6px] font-black px-1.5 py-0.5 rounded-lg flex-shrink-0"
                style={{ background: withAlpha(theme.primaryColor, 0.1), color: theme.primaryColor }}
              >
                ₺{item.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Telefon çerçevesi
───────────────────────────────────────────────────── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[22px] border-4 border-slate-800 shadow-xl overflow-hidden"
      style={{ width: 160, height: 300, background: '#1e293b', flexShrink: 0 }}
    >
      {/* Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-700 z-10" />
      <div className="absolute inset-0 top-5 overflow-hidden rounded-b-[18px]">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Renk seçici bileşeni
───────────────────────────────────────────────────── */

const PRESET_COLORS = [
  '#0f172a', '#1e40af', '#7c3aed', '#be185d', '#b91c1c',
  '#b45309', '#166534', '#0f766e', '#0369a1', '#374151',
  '#ffffff', '#f9fafb', '#fdf8f0', '#0a0a0f', '#1c1917',
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 shrink-0">{label}</span>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex-shrink-0"
            style={{ background: value }}
          />
          <input
            type="text"
            value={value}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            className="w-24 text-xs font-mono border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <input
            type="color"
            value={value.length === 7 ? value : '#000000'}
            onChange={e => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            title="Renk seçici"
          />
        </div>
      </div>
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
            style={{
              background: c,
              borderColor: value === c ? '#7c3aed' : c === '#ffffff' ? '#e2e8f0' : 'transparent',
              boxShadow: value === c ? '0 0 0 2px #7c3aed40' : undefined,
            }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Font seçici
───────────────────────────────────────────────────── */

const FONTS = [
  { id: 'sans', label: 'Modern', preview: 'Aa', style: 'system-ui, sans-serif' },
  { id: 'serif', label: 'Klasik', preview: 'Aa', style: 'Georgia, serif' },
  { id: 'mono', label: 'Teknik', preview: 'Aa', style: 'ui-monospace, monospace' },
] as const;

type FontId = (typeof FONTS)[number]['id'];

const FONT_CSS_MAP: Record<FontId, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, monospace',
};

/* ─────────────────────────────────────────────────────
   Düzen sabitleri
───────────────────────────────────────────────────── */

const LAYOUTS = [
  { id: 1, name: 'Minimal', desc: 'Liste görünüm, beyaz kartlar' },
  { id: 2, name: 'Modern', desc: 'Koyu zemin, ızgara kartlar' },
  { id: 3, name: 'Classic', desc: 'Sıcak tonlar, zarif header' },
];

/* ─────────────────────────────────────────────────────
   Ana sayfa
───────────────────────────────────────────────────── */

export function MenuTemplatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qrId = searchParams.get('qrId') ?? undefined;
  const isQrMode = Boolean(qrId);
  const nextRoute =
    searchParams.get('next') === 'qr' ? '/menu/qr?create=1' : '/menu/categories';

  /* ── Veri çekme ── */
  const { data: tenantSettings, isLoading: tenantLoading } = useQuery({
    queryKey: ['menu', 'settings'],
    queryFn: () => menuService.getMenuSettings(),
    enabled: !isQrMode,
  });

  const { data: qrDesign, isLoading: qrLoading } = useQuery({
    queryKey: ['menu', 'qr-design', qrId],
    queryFn: () => menuService.getQrCodeDesign(qrId!),
    enabled: isQrMode,
  });

  const isLoading = isQrMode ? qrLoading : tenantLoading;
  const settings = isQrMode ? qrDesign : tenantSettings;

  /* ── Yerel durum ── */
  const [layout, setLayout] = useState<number | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<FontId | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);

  /* ── Türetilmiş değerler ── */
  const currentLayout = layout ?? settings?.qrMenuTemplate ?? 1;
  const currentPrimary = primaryColor ?? settings?.primaryColor ?? '#0f172a';
  const currentBg = bgColor ?? settings?.bgColor ?? '#f9fafb';
  const currentText = textColor ?? settings?.textColor ?? '#1e293b';
  const currentFont: FontId = fontFamily ?? (settings?.fontFamily as FontId) ?? 'sans';

  const displayLogo = logoRemoved
    ? null
    : logoPreview ?? (settings?.logoUrl ? `${API_BASE}${settings.logoUrl}` : null);

  const theme: Theme = {
    primaryColor: currentPrimary.length === 7 ? currentPrimary : '#0f172a',
    bgColor: currentBg.length === 7 ? currentBg : '#f9fafb',
    textColor: currentText.length === 7 ? currentText : '#1e293b',
    fontFamily: currentFont,
    logoSrc: displayLogo,
    tenantName: 'Restoranım',
  };

  /* ── Dosya seçici ── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya 2MB\'den büyük olamaz.');
      return;
    }
    setLogoFile(file);
    setLogoRemoved(false);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  /* ── Mutasyonlar ── */
  const logoMutation = useMutation({
    mutationFn: (f: File) =>
      isQrMode ? menuService.uploadQrLogo(qrId!, f) : menuService.uploadLogo(f),
  });

  const designMutation = useMutation({
    mutationFn: (design: {
      qrMenuTemplate: number;
      primaryColor: string;
      bgColor: string;
      textColor: string;
      fontFamily: string;
    }) =>
      isQrMode
        ? menuService.saveQrCodeDesign(qrId!, design)
        : menuService.saveMenuDesign(design),
  });

  /* ── Kaydet ── */
  async function handleSave() {
    try {
      if (logoFile) await logoMutation.mutateAsync(logoFile);
      const design = {
        qrMenuTemplate: currentLayout,
        primaryColor: currentPrimary,
        bgColor: currentBg,
        textColor: currentText,
        fontFamily: currentFont,
      };
      await designMutation.mutateAsync(design);
      if (isQrMode) {
        qc.invalidateQueries({ queryKey: ['menu', 'qr-design', qrId] });
      } else {
        qc.invalidateQueries({ queryKey: ['menu', 'settings'] });
      }
      toast.success('Tasarım kaydedildi!');
      navigate(nextRoute);
    } catch {
      toast.error('Kaydedilemedi.');
    }
  }

  /* ── Düzen değiştirince varsayılan renkler ── */
  function applyLayoutDefaults(id: number) {
    setLayout(id);
    if (primaryColor === null && bgColor === null) {
      if (id === 1) { setPrimaryColor('#0f172a'); setBgColor('#f9fafb'); }
      if (id === 2) { setPrimaryColor('#7c3aed'); setBgColor('#0a0a0f'); }
      if (id === 3) { setPrimaryColor('#92400e'); setBgColor('#fdf8f0'); }
    }
  }

  const isSaving = logoMutation.isPending || designMutation.isPending;
  const PreviewComponent =
    currentLayout === 2 ? ModernLive : currentLayout === 3 ? ClassicLive : MinimalLive;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: 'Menü Yönetimi', to: '/menu' },
          { label: isQrMode ? 'QR Tasarımı' : 'Tasarım' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isQrMode ? 'QR Kodu Tasarımı' : 'Menü Tasarımı'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Logo, renkler, font ve düzeni özelleştirin. Sağda canlı önizleme.
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sol panel ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Logo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Upload size={16} className="text-slate-400" />
              Logo
            </h2>
            <p className="text-xs text-slate-400">Header'da görünür. JPEG / PNG / WebP, maks 2MB.</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {displayLogo ? (
                  <img src={displayLogo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-slate-300">L</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Upload size={14} />
                  {displayLogo ? 'Değiştir' : 'Yükle'}
                </button>
                {displayLogo && (
                  <button
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      setLogoRemoved(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-100 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} />
                    Kaldır
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Renkler */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Palette size={16} className="text-slate-400" />
              Renkler
            </h2>
            <ColorPicker label="Ana Renk" value={currentPrimary} onChange={setPrimaryColor} />
            <div className="h-px bg-slate-100" />
            <ColorPicker label="Arka Plan" value={currentBg} onChange={setBgColor} />
            <div className="h-px bg-slate-100" />
            <ColorPicker label="Yazı Rengi" value={currentText} onChange={setTextColor} />
          </div>

          {/* Font */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Type size={16} className="text-slate-400" />
              Font
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {FONTS.map(font => {
                const isActive = currentFont === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      isActive
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isActive && (
                      <div className="flex justify-end mb-1">
                        <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                    <span
                      className="block text-lg font-bold text-slate-800 leading-none"
                      style={{ fontFamily: font.style }}
                    >
                      {font.preview}
                    </span>
                    <span className="block text-xs text-slate-500 mt-1">{font.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Düzen */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Düzen</h2>
            <div className="grid grid-cols-3 gap-3">
              {LAYOUTS.map(l => {
                const isActive = currentLayout === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => applyLayoutDefaults(l.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      isActive
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isActive && (
                      <div className="flex justify-end mb-1">
                        <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                    <p className="font-semibold text-sm text-slate-900">{l.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{l.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sağ panel: canlı önizleme ── */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4 sticky top-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Canlı Önizleme</p>
          <PhoneFrame>
            <div
              className="w-full h-full"
              style={{ fontFamily: FONT_CSS_MAP[currentFont] }}
            >
              <PreviewComponent theme={theme} />
            </div>
          </PhoneFrame>
          <p className="text-[11px] text-slate-400 text-center max-w-[180px]">
            QR kodu tutan müşteri bu görünümü görür
          </p>
        </div>
      </div>

      {/* Alt bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => navigate('/menu')}
          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Geri
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-violet-200 disabled:opacity-50"
        >
          {isSaving && <Spinner />}
          {searchParams.get('next') === 'qr' ? 'Kaydet ve QR Oluştur' : 'Kaydet ve Devam Et'}
        </button>
      </div>
    </div>
  );
}
