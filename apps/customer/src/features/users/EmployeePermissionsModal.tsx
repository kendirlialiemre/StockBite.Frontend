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
    label: 'Menu',
    moduleId: ModuleType.Menu,
    permissions: [
      { key: Permissions.Menu.View, label: 'View Menu' },
      { key: Permissions.Menu.Edit, label: 'Edit Menu' },
    ],
  },
  {
    label: 'Orders',
    moduleId: ModuleType.Orders,
    permissions: [
      { key: Permissions.Orders.View, label: 'View Orders' },
      { key: Permissions.Orders.Create, label: 'Create Orders' },
      { key: Permissions.Orders.Close, label: 'Close Orders' },
      { key: Permissions.Orders.Cancel, label: 'Cancel Orders' },
    ],
  },
  {
    label: 'Stock',
    moduleId: ModuleType.Stock,
    permissions: [
      { key: Permissions.Stock.View, label: 'View Stock' },
      { key: Permissions.Stock.AddItem, label: 'Add Stock Items' },
      { key: Permissions.Stock.EditItem, label: 'Edit Stock Items' },
      { key: Permissions.Stock.AddMovement, label: 'Add Stock Movements' },
    ],
  },
  {
    label: 'Reports',
    moduleId: ModuleType.ProfitLoss,
    permissions: [
      { key: Permissions.ProfitLoss.View, label: 'View Profit & Loss' },
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
      toast.success('Permissions updated');
      onClose();
    },
    onError: () => toast.error('Failed to update permissions'),
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
      title={`Permissions: ${employee?.firstName} ${employee?.lastName}`}
      size="md"
    >
      <div className="space-y-4">
        {visibleGroups.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No modules are subscribed. Contact your administrator.
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
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Save Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
