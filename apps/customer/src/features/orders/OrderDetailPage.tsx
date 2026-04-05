
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, CreditCard, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, Permissions } from '@stockbite/api-client';
import { Button, Badge, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

const STATUS_LABEL: Record<number, string> = {
  0: 'Açık',
  1: 'Kapatıldı',
  2: 'İptal',
};

const STATUS_VARIANT: Record<number, 'success' | 'neutral' | 'danger'> = {
  0: 'success',
  1: 'neutral',
  2: 'danger',
};

const PAYMENT_LABEL: Record<number, string> = {
  0: 'Nakit',
  1: 'Kart',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  });

  const closeMutation = useMutation({
    mutationFn: (paymentMethod: 0 | 1) => orderService.closeOrder(id!, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Sipariş kapatıldı');
      setShowPaymentModal(false);
    },
    onError: () => toast.error('Sipariş kapatılamadı'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Sipariş iptal edildi');
    },
    onError: () => toast.error('Sipariş iptal edilemedi'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Sipariş bulunamadı.
      </div>
    );
  }

  const isOpen = order.status === 0;

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Siparişlere Dön
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {order.tableName ? `Masa: ${order.tableName}` : 'Paket Sipariş'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{order.id}</p>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <dt className="text-xs text-slate-500">Açılış</dt>
            <dd className="text-slate-700 mt-0.5">
              {new Date(order.openedAt).toLocaleString('tr-TR')}
            </dd>
          </div>
          {order.closedAt && (
            <div>
              <dt className="text-xs text-slate-500">Kapanış</dt>
              <dd className="text-slate-700 mt-0.5">
                {new Date(order.closedAt).toLocaleString('tr-TR')}
              </dd>
            </div>
          )}
          {order.paymentMethod != null && (
            <div>
              <dt className="text-xs text-slate-500">Ödeme Yöntemi</dt>
              <dd className="text-slate-700 mt-0.5 flex items-center gap-1">
                {order.paymentMethod === 0 ? <Banknote size={14} /> : <CreditCard size={14} />}
                {PAYMENT_LABEL[order.paymentMethod]}
              </dd>
            </div>
          )}
        </dl>

        {/* Items */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Ürün</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">Adet</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Fiyat</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400 text-sm">
                    Ürün yok
                  </td>
                </tr>
              )}
              {order.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {item.menuItemName}
                    {item.note && <p className="text-xs text-slate-400">{item.note}</p>}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-right text-slate-600">₺{item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    ₺{(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                  Toplam
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  ₺{order.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Actions */}
        {isOpen && (
          <div className="flex gap-3 mt-5 justify-end">
            {hasPermission(Permissions.Orders.Cancel) && (
              <Button
                variant="secondary"
                isLoading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                İptal Et
              </Button>
            )}
            {hasPermission(Permissions.Orders.Close) && (
              <Button
                variant="primary"
                onClick={() => setShowPaymentModal(true)}
              >
                Siparişi Kapat
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Ödeme Yöntemi</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-5">
              Toplam: <span className="font-bold text-slate-900">₺{order.totalAmount.toFixed(2)}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => closeMutation.mutate(0)}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
              >
                <Banknote size={32} className="text-green-600" />
                <span className="font-semibold text-slate-800">Nakit</span>
              </button>
              <button
                onClick={() => closeMutation.mutate(1)}
                disabled={closeMutation.isPending}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                <CreditCard size={32} className="text-blue-600" />
                <span className="font-semibold text-slate-800">Kart</span>
              </button>
            </div>

            {closeMutation.isPending && (
              <div className="flex justify-center mt-4">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
