
import { useAuthStore } from '../../store/authStore';
import { Badge } from '@stockbite/ui';

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your account information
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-700 text-xl font-semibold">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role === 'Owner' ? 'info' : 'neutral'}>
                {user.role}
              </Badge>
            </div>
          </div>
        </div>

        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500 mb-1">Email</dt>
            <dd className="text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 mb-1">User ID</dt>
            <dd className="text-slate-500 font-mono text-xs">{user.id}</dd>
          </div>
          {user.tenantId && (
            <div>
              <dt className="text-xs text-slate-500 mb-1">Tenant ID</dt>
              <dd className="text-slate-500 font-mono text-xs">
                {user.tenantId}
              </dd>
            </div>
          )}
          {user.role === 'Employee' && (
            <div>
              <dt className="text-xs text-slate-500 mb-1">Permissions</dt>
              <dd>
                {user.permissions.length === 0 ? (
                  <span className="text-slate-400">No permissions assigned</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {user.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
