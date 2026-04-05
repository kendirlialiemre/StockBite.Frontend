import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService, Permissions, ModuleType } from '@stockbite/api-client';
import type { EmployeeDto } from '@stockbite/api-client';
import { Modal, Button } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

interface EmployeePermissionsModalProps {
  employee: EmployeeDto | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionGroup {
  label: string;
  moduleId: number;
  permissions: { key: string; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Menü',
    moduleId: ModuleType.Menu,
    permissions: [
      { key: Permissions.Menu.View, label: 'Menüyü Görüntüle' },
      { key: Permissions.Menu.Edit, label: 'Menüyü Düzenle' },
    ],
  },
  {
    label: 'Siparişler',
    moduleId: ModuleType.Orders,
    permissions: [
      { key: Permissions.Orders.View, label: 'Siparişleri Görüntüle' },
      { key: Permissions.Orders.Create, label: 'Sipariş Oluştur' },
      { key: Permissions.Orders.Close, label: 'Sipariş Kapat' },
      { key: Permissions.Orders.Cancel, label: 'Sipariş İptal Et' },
    ],
  },
  {
    label: 'Stok',
    moduleId: ModuleType.Stock,
    permissions: [
      { key: Permissions.Stock.View, label: 'Stoku Görüntüle' },
      { key: Permissions.Stock.AddItem, label: 'Stok Kalemi Ekle' },
      { key: Permissions.Stock.EditItem, label: 'Stok Kalemini Düzenle' },
      { key: Permissions.Stock.AddMovement, label: 'Stok Hareketi Ekle' },
    ],
  },
  {
    label: 'Masa Yönetimi',
    moduleId: ModuleType.Tables,
    permissions: [
      { key: Permissions.Tables.View, label: 'Masaları Görüntüle' },
      { key: Permissions.Tables.Manage, label: 'Masa Yönet / Ödeme Al' },
    ],
  },
  {
    label: 'Raporlar',
    moduleId: ModuleType.ProfitLoss,
    permissions: [
      { key: Permissions.ProfitLoss.View, label: 'Kâr/Zarar Görüntüle' },
    ],
  },
];

export function EmployeePermissionsModal({
  employee,
  isOpen,
  onClose,
}: EmployeePermissionsModalProps) {
  const queryClient = useQueryClient();
  const subscribedModules = useAuthStore((s) => s.subscribedModules);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (employee) {
      setSelected(new Set(employee.permissions));
    }
  }, [employee]);

  const mutation = useMutation({
    mutationFn: () =>
      userService.updatePermissions(employee!.id, {
        permissions: Array.from(selected),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'employees'] });
      toast.success('İzinler güncellendi');
      onClose();
    },
    onError: () => toast.error('İzinler güncellenemedi'),
  });

  function togglePermission(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleGroup(group: PermissionGroup) {
    const allSelected = group.permissions.every((p) => selected.has(p.key));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        group.permissions.forEach((p) => next.delete(p.key));
      } else {
        group.permissions.forEach((p) => next.add(p.key));
      }
      return next;
    });
  }

  const visibleGroups = PERMISSION_GROUPS.filter((g) =>
    subscribedModules.includes(g.moduleId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`İzinler: ${employee?.firstName} ${employee?.lastName}`}
      size="md"
    >
      <div className="space-y-4">
        {visibleGroups.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Abone olunan modül yok. Yöneticinize başvurun.
          </p>
        )}

        {visibleGroups.map((group) => {
          const allSelected = group.permissions.every((p) =>
            selected.has(p.key)
          );
          const someSelected = group.permissions.some((p) =>
            selected.has(p.key)
          );

          return (
            <div
              key={group.label}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-slate-900">
                  {group.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {group.permissions.filter((p) => selected.has(p.key))
                      .length}{' '}
                    / {group.permissions.length}
                  </span>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => toggleGroup(group)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </button>
              <div className="px-4 py-2 space-y-1">
                {group.permissions.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-3 py-1.5 cursor-pointer hover:text-indigo-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            İptal
          </Button>
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
