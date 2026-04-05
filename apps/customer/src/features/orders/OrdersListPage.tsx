
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
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

export function OrdersListPage() {
  const { hasPermission } = useAuthStore();

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getOrders(),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and manage restaurant orders
          </p>
        </div>
        {hasPermission(Permissions.Orders.Create) && (
          <Link to="/orders/new">
            <Button variant="primary" size="md">
              <Plus size={16} />
              New Order
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {isError && (
          <div className="py-10 text-center text-sm text-red-500">
            Failed to load orders.
          </div>
        )}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Table
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Opened
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
              {orders?.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-emerald-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {order.tableName ?? 'No table'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.openedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={14} />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
