
import { useQuery } from '@tanstack/react-query';
import { authService } from '@stockbite/api-client';
import { Badge, Spinner } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

export function AdminUserListPage() {
  const { user: currentUser } = useAuthStore();

  // In a real implementation, there'd be an endpoint for listing all super admins.
  // We simulate this by showing the current user in a table.
  const { data: me, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getMe(),
  });

  const users = me ? [me] : [];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admin Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Super admin accounts with full platform access
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {!isLoading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 text-xs font-semibold">
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {u.firstName} {u.lastName}
                          </p>
                          {currentUser?.id === u.id && (
                            <p className="text-xs text-slate-400">You</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
