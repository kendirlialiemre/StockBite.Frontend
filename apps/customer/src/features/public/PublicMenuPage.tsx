import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';

interface PublicMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}
interface PublicMenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: PublicMenuItem[];
}
interface PublicMenuData {
  tenantName: string;
  slug: string;
  qrMenuTemplate: number;
  logoUrl?: string | null;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  categories: PublicMenuCategory[];
}

const FONT_CSS: Record<string, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, monospace',
};

const API_BASE = 'http://localhost:5000';

async function fetchPublicMenu(slug: string, ref?: string): Promise<PublicMenuData> {
  const { data } = await apiClient.get(`/public/menu/${slug}`, { params: ref ? { ref } : undefined });
  return data;
}

/* ─────────────────────────────────────────────────────
   Renk yardımcıları
───────────────────────────────────────────────────── */

function contrastText(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1e293b' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

function withAlpha(hex: string, alpha: number): string {
  try {
    return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}

function LogoOrInitial({ data, size }: { data: PublicMenuData; size: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-2xl';
  const radius = size === 'lg' ? 'rounded-3xl' : 'rounded-2xl';
  const onPrimary = contrastText(data.primaryColor);
  if (data.logoUrl) {
    return (
      <div className={`${dim} ${radius} overflow-hidden shadow-lg`}>
        <img src={`${API_BASE}${data.logoUrl}`} alt={data.tenantName} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${dim} ${radius} flex items-center justify-center shadow-lg ${textSize} font-black`}
      style={{ background: data.primaryColor, color: onPrimary }}>
      {data.tenantName[0]}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Sayfa giriş noktası
───────────────────────────────────────────────────── */

export function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') ?? undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-menu', slug, ref],
    queryFn: () => fetchPublicMenu(slug!, ref),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Spinner />
    </div>
  );
  if (isError || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-slate-400 text-sm">Menü bulunamadı.</p>
    </div>
  );

  const fontCss = FONT_CSS[data.fontFamily] ?? FONT_CSS.sans;
  const inner = data.qrMenuTemplate === 2
    ? <ModernTemplate data={data} />
    : data.qrMenuTemplate === 3
      ? <ClassicTemplate data={data} />
      : <MinimalTemplate data={data} />;

  return <div style={{ fontFamily: fontCss }}>{inner}</div>;
}

/* ══════════════════════════════════════════
   TEMPLATE 1 — MİNİMAL
══════════════════════════════════════════ */
function MinimalTemplate({ data }: { data: PublicMenuData }) {
  const cats = data.categories.filter(c => c.items.length > 0);
  const [active, setActive] = useState(cats[0]?.id ?? '');
  const current = cats.find(c => c.id === active);
  const onPrimary = contrastText(data.primaryColor);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: data.bgColor }}>
      {/* Hero header */}
      <div className="bg-white pt-12 pb-8 text-center px-4 shadow-sm">
        <div className="flex justify-center mb-4">
          <LogoOrInitial data={data} size="md" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{data.tenantName}</h1>
        <p className="text-slate-400 text-sm mt-1">Dijital Menü</p>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cats.map(cat => (
              <button key={cat.id} onClick={() => setActive(cat.id)}
                className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                style={active === cat.id
                  ? { background: data.primaryColor, color: onPrimary }
                  : { background: withAlpha(data.primaryColor, 0.08), color: data.primaryColor }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-3">
        {current?.items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex min-h-[88px]"
            style={{ border: `1px solid ${withAlpha(data.primaryColor, 0.1)}` }}>
            {item.imageUrl && (
              <div className="w-28 flex-shrink-0 relative">
                <img src={`${API_BASE}${item.imageUrl}`} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col justify-center px-4 py-4 flex-1 min-w-0 gap-1">
              <p className="font-bold" style={{ color: data.textColor }}>{item.name}</p>
              {item.description && <p className="text-xs line-clamp-2" style={{ color: withAlpha(data.textColor, 0.55) }}>{item.description}</p>}
              <p className="text-base font-black mt-1" style={{ color: data.primaryColor }}>₺{item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-300 pb-8">StockBite ile oluşturuldu</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   TEMPLATE 2 — MODERN
══════════════════════════════════════════ */
function ModernTemplate({ data }: { data: PublicMenuData }) {
  const cats = data.categories.filter(c => c.items.length > 0);
  const [active, setActive] = useState(cats[0]?.id ?? '');
  const current = cats.find(c => c.id === active);
  const onPrimary = contrastText(data.primaryColor);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: data.bgColor }}>
      {/* Gradient hero */}
      <div className="pt-14 pb-10 text-center px-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.bgColor} 100%)` }}>
        <div className="relative flex flex-col items-center gap-4">
          <LogoOrInitial data={data} size="lg" />
          <h1 className="text-3xl font-black tracking-tight" style={{ color: onPrimary }}>{data.tenantName}</h1>
          <p className="text-sm font-medium" style={{ color: withAlpha(onPrimary, 0.6) }}>Dijital Menü</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 py-4 px-4"
        style={{ background: withAlpha(data.bgColor, 0.95), backdropFilter: 'blur(12px)', borderBottom: `1px solid ${withAlpha('#ffffff', 0.05)}` }}>
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cats.map(cat => (
              <button key={cat.id} onClick={() => setActive(cat.id)}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                style={active === cat.id
                  ? { background: data.primaryColor, color: onPrimary }
                  : { background: withAlpha('#ffffff', 0.06), color: withAlpha('#ffffff', 0.5) }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {current?.items.map(item => (
            <div key={item.id} className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: withAlpha('#ffffff', 0.05), border: `1px solid ${withAlpha('#ffffff', 0.07)}` }}>
              {item.imageUrl
                ? <img src={`${API_BASE}${item.imageUrl}`} alt={item.name} className="w-full h-32 object-cover" />
                : <div className="w-full h-20 flex items-center justify-center"
                    style={{ background: withAlpha(data.primaryColor, 0.12) }}>
                    <span className="text-3xl font-black" style={{ color: withAlpha(data.primaryColor, 0.4) }}>{item.name[0]}</span>
                  </div>
              }
              <div className="p-3 flex flex-col gap-1 flex-1">
                <p className="font-bold text-sm leading-tight" style={{ color: data.textColor }}>{item.name}</p>
                {item.description && <p className="text-xs line-clamp-2" style={{ color: withAlpha(data.textColor, 0.45) }}>{item.description}</p>}
                <p className="font-black text-base mt-auto pt-1" style={{ color: data.primaryColor }}>₺{item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs pb-8" style={{ color: withAlpha('#ffffff', 0.08) }}>StockBite ile oluşturuldu</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   TEMPLATE 3 — CLASSİC
══════════════════════════════════════════ */
function ClassicTemplate({ data }: { data: PublicMenuData }) {
  const cats = data.categories.filter(c => c.items.length > 0);
  const [active, setActive] = useState(cats[0]?.id ?? '');
  const current = cats.find(c => c.id === active);
  const onPrimary = contrastText(data.primaryColor);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: data.bgColor }}>
      {/* Header */}
      <div className="text-center py-12 px-4"
        style={{ background: `linear-gradient(180deg, ${data.primaryColor} 0%, ${withAlpha(data.primaryColor, 0.85)} 100%)` }}>
        <p className="text-xs tracking-[0.4em] uppercase mb-3 font-medium" style={{ color: withAlpha(onPrimary, 0.6) }}>Hoş Geldiniz</p>
        {data.logoUrl && (
          <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden shadow-lg"
            style={{ border: `2px solid ${withAlpha(onPrimary, 0.3)}` }}>
            <img src={`${API_BASE}${data.logoUrl}`} alt={data.tenantName} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', color: onPrimary }}>
          {data.tenantName}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16" style={{ background: withAlpha(onPrimary, 0.3) }} />
          <span style={{ color: withAlpha(onPrimary, 0.6) }}>✦</span>
          <div className="h-px w-16" style={{ background: withAlpha(onPrimary, 0.3) }} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 py-4 px-4"
        style={{ background: withAlpha(data.primaryColor, 0.88), boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            {cats.map(cat => (
              <button key={cat.id} onClick={() => setActive(cat.id)}
                className="flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                style={active === cat.id
                  ? { background: data.bgColor, color: data.primaryColor }
                  : { color: withAlpha(onPrimary, 0.6) }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-3">
        {current?.items.map(item => (
          <div key={item.id} className="rounded-2xl overflow-hidden flex shadow-sm min-h-[88px]"
            style={{ background: '#fff', border: `1px solid ${withAlpha(data.primaryColor, 0.12)}` }}>
            {item.imageUrl
              ? <div className="w-28 flex-shrink-0 relative">
                  <img src={`${API_BASE}${item.imageUrl}`} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              : <div className="w-16 flex-shrink-0 flex items-center justify-center"
                  style={{ background: withAlpha(data.primaryColor, 0.06) }}>
                  <span className="text-2xl font-black" style={{ color: data.primaryColor }}>{item.name[0]}</span>
                </div>
            }
            <div className="flex items-center justify-between gap-3 px-4 py-3 flex-1 min-w-0">
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: data.textColor }}>{item.name}</p>
                {item.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: withAlpha(data.textColor, 0.6) }}>{item.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 rounded-xl px-3 py-1.5"
                style={{ background: withAlpha(data.primaryColor, 0.1), border: `1px solid ${withAlpha(data.primaryColor, 0.2)}` }}>
                <span className="font-black text-sm" style={{ color: data.primaryColor }}>₺{item.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs pb-8" style={{ color: withAlpha(data.primaryColor, 0.25) }}>StockBite ile oluşturuldu</p>
    </div>
  );
}
