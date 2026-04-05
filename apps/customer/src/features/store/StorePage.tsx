import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@stockbite/api-client';
import { Spinner } from '@stockbite/ui';
import { ShoppingCart, Plus, Check } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';

type PackageModuleDto = { moduleType: number; moduleName: string };
type PackageDto = {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  modules: PackageModuleDto[];
};

const MODULE_NAMES: Record<number, string> = {
  1: 'Menü',
  2: 'Siparişler',
  3: 'Stok',
  4: 'Kar/Zarar',
};

const MODULE_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-purple-100 text-purple-700',
};

async function fetchPublicPackages(): Promise<PackageDto[]> {
  const res = await apiClient.get('/packages');
  return res.data;
}

export function StorePage() {
  const { items, addItem, removeItem } = useCartStore();
  const navigate = useNavigate();

  const { data: packages, isLoading, isError } = useQuery({
    queryKey: ['public', 'packages'],
    queryFn: fetchPublicPackages,
    staleTime: 0,
  });

  function handleToggle(pkg: PackageDto) {
    if (items.find((i) => i.id === pkg.id)) {
      removeItem(pkg.id);
    } else {
      addItem(pkg);
      toast.success(`${pkg.name} sepete eklendi.`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-red-600">Paketler yüklenemedi.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paket Mağazası</h1>
          <p className="text-sm text-slate-500 mt-1">
            İşletmeniz için uygun paketi seçin ve modüllerinizi aktifleştirin.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => navigate('/checkout')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <ShoppingCart size={16} />
            Sepete Git
            <span className="bg-white text-emerald-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          </button>
        )}
      </div>

      {(!packages || packages.length === 0) ? (
        <div className="text-center py-16">
          <ShoppingCart className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Şu an satışa sunulan paket bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const inCart = !!items.find((i) => i.id === pkg.id);
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col ${
                  inCart ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                }`}
              >
                <div className="p-6 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-slate-500 mb-4">{pkg.description}</p>
                  )}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-emerald-600">
                      ₺{pkg.price.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-sm ml-1">/ay</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Dahil Modüller
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.modules.map((m) => (
                        <span
                          key={m.moduleType}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            MODULE_COLORS[m.moduleType] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {MODULE_NAMES[m.moduleType] ?? m.moduleName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleToggle(pkg)}
                    className={`w-full text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      inCart
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                        : 'bg-slate-900 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check size={16} />
                        Sepette — Kaldır
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Sepete Ekle
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
