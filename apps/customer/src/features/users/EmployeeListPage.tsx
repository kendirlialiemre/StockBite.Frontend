import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userService } from '@stockbite/api-client';
import type { EmployeeDto, CreateEmployeeRequest } from '@stockbite/api-client';
import { Button, Badge, Spinner, Modal, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';
import { EmployeePermissionsModal } from './EmployeePermissionsModal';

const emptyCreate = (): CreateEmployeeRequest => ({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
});

export function EmployeeListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [permissionsEmployee, setPermissionsEmployee] =
    useState<EmployeeDto | null>(null);
  const [form, setForm] = useState<CreateEmployeeRequest>(emptyCreate());
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEmployeeRequest, string>>
  >({});

  // Owner-only guard
  if (user?.role !== 'Owner') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: employees, isLoading } = useQuery({
    queryKey: ['users', 'employees'],
    queryFn: () => userService.getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateEmployeeRequest) =>
      userService.createEmployee(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'employees'] });
      toast.success('Employee created');
      setShowCreate(false);
      setForm(emptyCreate());
    },
    onError: () => toast.error('Failed to create employee'),
  });

  function validate() {
    const errs: typeof errors = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.password.trim()) errs.password = 'Password is required';
    else if (form.password.length < 8)
      errs.password = 'Min. 8 characters';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    createMutation.mutate(form);
  }

  function closeCreate() {
    setShowCreate(false);
    setForm(emptyCreate());
    setErrors({});
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage staff accounts and permissions
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          Add Employee
        </Button>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Permissions
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    No employees yet. Add your first team member.
                  </td>
                </tr>
              )}
              {employees?.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-emerald-50 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-700 text-xs font-semibold">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.role === 'Owner' ? 'info' : 'neutral'}>
                      {emp.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.isActive ? 'success' : 'neutral'}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {emp.role === 'Owner'
                      ? 'All permissions'
                      : `${emp.permissions.length} permissions`}
                  </td>
                  <td className="px-4 py-3">
                    {emp.role === 'Employee' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPermissionsEmployee(emp)}
                      >
                        <Settings size={14} />
                        Permissions
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreate}
        onClose={closeCreate}
        title="Add Employee"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => {
                setForm((p) => ({ ...p, firstName: e.target.value }));
                setErrors((p) => ({ ...p, firstName: undefined }));
              }}
              placeholder="John"
              error={errors.firstName}
              required
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => {
                setForm((p) => ({ ...p, lastName: e.target.value }));
                setErrors((p) => ({ ...p, lastName: undefined }));
              }}
              placeholder="Doe"
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }));
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="employee@restaurant.com"
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm((p) => ({ ...p, password: e.target.value }));
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="Min. 8 characters"
            error={errors.password}
            required
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={closeCreate}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <EmployeePermissionsModal
        employee={permissionsEmployee}
        isOpen={!!permissionsEmployee}
        onClose={() => setPermissionsEmployee(null)}
      />
    </div>
  );
}
