
import { Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ModuleGuardProps {
  moduleId: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultLockedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Lock size={28} className="text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Module Not Activated
      </h2>
      <p className="text-sm text-slate-500 max-w-sm">
        This feature isn't included in your current plan. Please contact your
        administrator to enable this module.
      </p>
    </div>
  );
}

export function ModuleGuard({ moduleId, children, fallback }: ModuleGuardProps) {
  const hasModule = useAuthStore((s) => s.hasModule);

  if (!hasModule(moduleId)) {
    return <>{fallback ?? <DefaultLockedScreen />}</>;
  }

  return <>{children}</>;
}
