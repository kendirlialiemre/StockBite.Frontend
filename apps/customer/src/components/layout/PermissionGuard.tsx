
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultUnauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <ShieldOff size={28} className="text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Access Denied
      </h2>
      <p className="text-sm text-slate-500 max-w-sm">
        You don't have permission to view this page. Ask your manager to grant
        you access.
      </p>
    </div>
  );
}

export function PermissionGuard({
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!hasPermission(permission)) {
    return <>{fallback ?? <DefaultUnauthorized />}</>;
  }

  return <>{children}</>;
}
