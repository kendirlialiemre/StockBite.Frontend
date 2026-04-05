import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

const MODULE_NAMES: Record<number, string> = {
  1: 'Menü',
  2: 'Siparişler',
  3: 'Stok',
  4: 'Kar/Zarar',
};

async function initiatePayment(packageId: string, callbackUrl: string) {
  const res = await apiClient.post('/payments/initiate', { packageId, callbackUrl });
  return res.data as { checkoutFormContent: string; token: string };
}

export function CheckoutPage() {
  const { items, removeItem, total } = useCartStore();
  const navigate = useNavigate();
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null);
  const [payingPackageId, setPayingPackageId] = useState<string | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // iyzico script'lerini çalıştır
  useEffect(() => {
    if (!checkoutFormContent || !formContainerRef.current) return;
    const scripts = Array.from(formContainerRef.current.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      if (oldScript.src) {
        newScript.src = oldScript.src;
        newScript.async = true;
      } else {
        newScript.textContent = oldScript.textContent ?? '';
      }
      document.head.appendChild(newScript);
    });
    formContainerRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [checkoutFormContent]);

  const payMutation = useMutation({
    mutationFn: ({ packageId }: { packageId: string }) => {
      const callbackUrl = `${window.location.origin.replace('3001', '5000')}/api/payments/callback`;
      return initiatePayment(packageId, callbackUrl);
    },
    onSuccess: (data) => {
      setCheckoutFormContent(data.checkoutFormContent);
      setPayingPackageId(null);
    },
    onError: () => {
      toast.error('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
      setPayingPackageId(null);
    },
  });

  function handlePay(packageId: string) {
    setPayingPackageId(packageId);
    setCheckoutFormContent(null);
    payMutation.mutate({ packageId });
  }

  if (items.length === 0 && !checkoutFormContent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
        <ShoppingBag className="text-slate-300" size={48} />
        <p className="text-slate-500 font-medium">Sepetiniz boş.</p>
        <button
          onClick={() => navigate('/store')}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Mağazaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/store')}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sepetim</h1>
          <p className="text-sm text-slate-500">Satın almak istediğiniz paketleri inceleyin.</p>
        </div>
      </div>

      {/* Sepet öğeleri */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        {items.map((pkg, idx) => (
          <div
            key={pkg.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              idx !== 0 ? 'border-t border-slate-100' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{pkg.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {pkg.modules.map((m) => (
                  <span
                    key={m.moduleType}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    {MODULE_NAMES[m.moduleType] ?? m.moduleName}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-lg font-bold text-emerald-600 whitespace-nowrap">
              ₺{pkg.price.toFixed(2)}
            </span>
            <button
              onClick={() => {
                removeItem(pkg.id);
                if (payingPackageId === pkg.id) {
                  setPayingPackageId(null);
                  setCheckoutFormContent(null);
                }
              }}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => handlePay(pkg.id)}
              disabled={payMutation.isPending && payingPackageId === pkg.id}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {payMutation.isPending && payingPackageId === pkg.id ? (
                <Spinner />
              ) : (
                <>
                  <CreditCard size={15} />
                  Öde
                </>
              )}
            </button>
          </div>
        ))}

        {/* Toplam */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-600">Toplam</span>
          <span className="text-xl font-extrabold text-slate-900">₺{total().toFixed(2)}</span>
        </div>
      </div>

      {/* iyzico ödeme formu */}
      {checkoutFormContent && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Ödeme Bilgileri</h2>
          </div>
          <div
            ref={formContainerRef}
            id="iyzico-checkout-form"
            className="p-4"
            dangerouslySetInnerHTML={{ __html: checkoutFormContent }}
          />
        </div>
      )}
    </div>
  );
}
