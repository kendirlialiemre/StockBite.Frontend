import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService, ModuleType } from '@stockbite/api-client';
import type { TenantModuleDto } from '@stockbite/api-client';
import { Badge, Button, Modal, Input } from '@stockbite/ui';
import { ShoppingCart, UtensilsCrossed, Package, TrendingUp, Plus } from 'lucide-react';

interface ModuleAssignmentPanelProps {
  tenantId: string;
  modules: TenantModuleDto[];
}

const MODULE_META: Record<number, { label: string; icon: React.ReactNode; description: string }> = {
  [ModuleType.Menu]: {
    label: 'Menu',
    icon: <UtensilsCrossed size={18} />,
    description: 'Digital menu management with categories and pricing',
  },
  [ModuleType.Orders]: {
    label: 'Orders',
    icon: <ShoppingCart size={18} />,
    description: 'Table orders, tracking and lifecycle management',
  },
  [ModuleType.Stock]: {
    label: 'Stock',
    icon: <Package size={18} />,
    description: 'Inventory tracking and stock movement history',
  },
  [ModuleType.ProfitLoss]: {
    label: 'Profit & Loss',
    icon: <TrendingUp size={18} />,
    description: 'Revenue, cost and profit reporting with charts',
  },
};

const ALL_MODULE_IDS = [
  ModuleType.Menu,
  ModuleType.Orders,
  ModuleType.Stock,
  ModuleType.ProfitLoss,
];

interface AssignFormState {
  moduleId: number;
  expiresAt: string;
}

export function ModuleAssignmentPanel({
  tenantId,
  modules,
}: ModuleAssignmentPanelProps) {
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignFormState>({
    moduleId: ModuleType.Menu,
    expiresAt: '',
  });

  const activeModuleIds = new Set(
    modules.filter((m) => m.isActive).map((m) => m.moduleId)
  );

  const assignMutation = useMutation({
    mutationFn: () =>
      adminService.assignModule(tenantId, {
        moduleId: assignForm.moduleId,
        expiresAt: assignForm.expiresAt || undefined,
        grantedByAdmin: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'tenant-modules', tenantId],
      });
      toast.success('Module assigned successfully');
      setShowAssign(false);
    },
    onError: () => toast.error('Failed to assign module'),
  });

  const revokeMutation = useMutation({
    mutationFn: (moduleId: number) =>
      adminService.revokeModule(tenantId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'tenant-modules', tenantId],
      });
      toast.success('Module revoked');
    },
    onError: () => toast.error('Failed to revoke module'),
  });

  function getModuleInfo(moduleId: number): TenantModuleDto | undefined {
    return modules.find((m) => m.moduleId === moduleId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Module Subscriptions
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAssign(true)}
        >
          <Plus size={14} />
          Assign Module
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ALL_MODULE_IDS.map((moduleId) => {
          const meta = MODULE_META[moduleId];
          const info = getModuleInfo(moduleId);
          const isActive = activeModuleIds.has(moduleId);

          return (
            <div
              key={moduleId}
              className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-md ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {meta.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {meta.label}
                    </p>
                    {info?.grantedByAdmin && (
                      <Badge variant="info">Admin granted</Badge>
                    )}
                    <Badge variant={isActive ? 'success' : 'neutral'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {meta.description}
                  </p>
                  {info && (
                    <div className="flex gap-3 mt-1 text-xs text-slate-400">
                      <span>
                        Since{' '}
                        {new Date(info.startsAt).toLocaleDateString()}
                      </span>
                      {info.expiresAt && (
                        <span>
                          Expires{' '}
                          {new Date(info.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={revokeMutation.isPending}
                  onClick={() => revokeMutation.mutate(moduleId)}
                >
                  Revoke
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Module Modal */}
      <Modal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Module"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Module
            </label>
            <select
              value={assignForm.moduleId}
              onChange={(e) =>
                setAssignForm((prev) => ({
                  ...prev,
                  moduleId: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ALL_MODULE_IDS.map((id) => (
                <option key={id} value={id}>
                  {MODULE_META[id].label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Expiry Date (optional)"
            type="date"
            value={assignForm.expiresAt}
            onChange={(e) =>
              setAssignForm((prev) => ({
                ...prev,
                expiresAt: e.target.value,
              }))
            }
            helperText="Leave blank for no expiry"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowAssign(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
