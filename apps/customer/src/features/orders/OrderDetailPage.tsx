
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, Permissions } from '@stockbite/api-client';
import { Button, Badge, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

const STATUS_LABEL: Record<number, string> = {
  0: 'Open',
  1: 'Closed',
  2: 'Cancelled',
};

const STATUS_VARIANT: Record<number, 'success' | 'neutral' | 'danger'> = {
  0: 'success',
  1: 'neutral',
  2: 'danger',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  });

  const closeMutation = useMutation({
    mutationFn: () => orderService.closeOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order closed');
    },
    onError: () => toast.error('Failed to close order'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: () => toast.error('Failed to cancel order'),
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
        Order not found.
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
        Back to Orders
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {order.tableName ? `Table: ${order.tableName}` : 'Takeaway Order'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{order.id}</p>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <dt className="text-xs text-slate-500">Opened</dt>
            <dd className="text-slate-700 mt-0.5">
              {new Date(order.openedAt).toLocaleString()}
            </dd>
          </div>
          {order.closedAt && (
            <div>
              <dt className="text-xs text-slate-500">Closed</dt>
              <dd className="text-slate-700 mt-0.5">
                {new Date(order.closedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>

        {/* Items */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">
                  Item
                </th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">
                  Qty
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">
                  Price
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-slate-400 text-sm"
                  >
                    No items
                  </td>
                </tr>
              )}
              {order.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {item.menuItemName}
                    {item.note && (
                      <p className="text-xs text-slate-400">{item.note}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-sm font-semibold text-slate-900 text-right"
                >
                  Total
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  ${order.totalAmount.toFixed(2)}
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
                Cancel Order
              </Button>
            )}
            {hasPermission(Permissions.Orders.Close) && (
              <Button
                variant="primary"
                isLoading={closeMutation.isPending}
                onClick={() => closeMutation.mutate()}
              >
                Close Order
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
