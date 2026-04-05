import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, menuService } from '@stockbite/api-client';
import type { TableDto, MenuItemDto } from '@stockbite/api-client';
import { Button, Spinner } from '@stockbite/ui';

interface CartItem {
  menuItem: MenuItemDto;
  quantity: number;
}

export function NewOrderPage() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<TableDto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => orderService.getTables(),
  });

  const { data: categories } = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuService.getCategories(),
  });

  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu', 'items'],
    queryFn: () => menuService.getItems(),
    enabled: !!selectedTable,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await orderService.createOrder({
        tableId: selectedTable?.id,
      });
      for (const ci of cart) {
        await orderService.addOrderItem(order.id, {
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
        });
      }
      return order;
    },
    onSuccess: (order) => {
      toast.success('Order created!');
      navigate(`/orders/${order.id}`);
    },
    onError: () => toast.error('Failed to create order'),
  });

  function addToCart(item: MenuItemDto) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((ci) => ci.menuItem.id !== itemId);
      return prev.map((ci) =>
        ci.menuItem.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
      );
    });
  }

  const total = cart.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    0
  );

  const getItemQty = (itemId: string) =>
    cart.find((ci) => ci.menuItem.id === itemId)?.quantity ?? 0;

  const itemsByCategory = categories?.map((cat) => ({
    category: cat,
    items: menuItems?.filter((item) => item.categoryId === cat.id) ?? [],
  }));

  const uncategorized = menuItems?.filter((item) => !item.categoryId) ?? [];

  if (tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New Order</h1>
        </div>
      </div>

      {/* Table Selection */}
      {!selectedTable ? (
        <div className="space-y-3">
          <h2 className="text-base font-medium text-slate-900">
            Select a Table
          </h2>
          {tables?.length === 0 && (
            <p className="text-sm text-slate-400">No tables configured.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables?.filter((t) => t.isActive).map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className="bg-white border border-slate-200 rounded-lg p-5 text-center hover:border-emerald-400 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-slate-900 text-base">
                  {table.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {table.capacity} seats
                </p>
              </button>
            ))}
            <button
              onClick={() => setSelectedTable({ id: '', name: 'Takeaway', capacity: 0, isActive: true })}
              className="bg-white border border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-emerald-400 transition-all"
            >
              <p className="font-semibold text-slate-900 text-base">Takeaway</p>
              <p className="text-xs text-slate-500 mt-0.5">No table</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Menu */}
          <div className="flex-1 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-slate-900">
                Table: {selectedTable.name}
              </h2>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-sm text-slate-400 hover:text-slate-700 underline"
              >
                Change table
              </button>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6">
                {itemsByCategory?.map(({ category, items }) =>
                  items.length > 0 ? (
                    <div key={category.id}>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const qty = getItemQty(item.id);
                          return (
                            <div
                              key={item.id}
                              className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {qty > 0 && (
                                  <>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="text-sm font-semibold w-5 text-center">
                                      {qty}
                                    </span>
                                  </>
                                )}
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null
                )}

                {uncategorized.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      Other
                    </h3>
                    <div className="space-y-2">
                      {uncategorized.map((item) => {
                        const qty = getItemQty(item.id);
                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {qty > 0 && (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-sm font-semibold w-5 text-center">
                                    {qty}
                                  </span>
                                </>
                              )}
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm sticky top-6">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ShoppingCart size={16} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Order Summary
                </h3>
              </div>
              <div className="px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
                {cart.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No items added yet
                  </p>
                )}
                {cart.map((ci) => (
                  <div
                    key={ci.menuItem.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700 flex-1 truncate">
                      {ci.menuItem.name}
                    </span>
                    <span className="text-slate-500 ml-2 flex-shrink-0">
                      x{ci.quantity}
                    </span>
                    <span className="text-slate-900 font-medium ml-3 flex-shrink-0">
                      ${(ci.menuItem.price * ci.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <div className="flex justify-between text-sm font-semibold text-slate-900 mb-3">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={cart.length === 0}
                  isLoading={createOrderMutation.isPending}
                  onClick={() => createOrderMutation.mutate()}
                >
                  Create Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
