import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Trash2 } from 'lucide-react';
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
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeDto | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'employees'] });
      toast.success('Çalışan silindi');
      setDeleteEmployee(null);
    },
    onError: () => toast.error('Çalışan silinemedi'),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateEmployeeRequest) =>
      userService.createEmployee(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'employees'] });
      toast.success('Çalışan oluşturuldu');
      setShowCreate(false);
      setForm(emptyCreate());
    },
    onError: () => toast.error('Çalışan oluşturulamadı'),
  });

  function validate() {
    const errs: typeof errors = {};
    if (!form.email.trim()) errs.email = 'E-posta zorunludur';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Geçersiz e-posta';
    if (!form.firstName.trim()) errs.firstName = 'Ad zorunludur';
    if (!form.lastName.trim()) errs.lastName = 'Soyad zorunludur';
    if (!form.password.trim()) errs.password = 'Şifre zorunludur';
    else if (form.password.length < 8)
      errs.password = 'En az 8 karakter';
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
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Çalışanlar</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Personel hesapları ve izinlerini yönet
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          Çalışan Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {!isLoading && (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Ad Soyad
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  E-posta
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  İzinler
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
                    Henüz çalışan yok. İlk ekip üyenizi ekleyin.
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
                      {emp.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {emp.role === 'Owner'
                      ? 'Tüm izinler'
                      : `${emp.permissions.length} izin`}
                  </td>
                  <td className="px-4 py-3">
                    {emp.role === 'Employee' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPermissionsEmployee(emp)}
                        >
                          <Settings size={14} />
                          İzinler
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteEmployee(emp)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreate}
        onClose={closeCreate}
        title="Çalışan Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad"
              value={form.firstName}
              onChange={(e) => {
                setForm((p) => ({ ...p, firstName: e.target.value }));
                setErrors((p) => ({ ...p, firstName: undefined }));
              }}
              placeholder="Ali"
              error={errors.firstName}
              required
            />
            <Input
              label="Soyad"
              value={form.lastName}
              onChange={(e) => {
                setForm((p) => ({ ...p, lastName: e.target.value }));
                setErrors((p) => ({ ...p, lastName: undefined }));
              }}
              placeholder="Yılmaz"
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="E-posta"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }));
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="calisan@restoran.com"
            error={errors.email}
            required
          />
          <Input
            label="Şifre"
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm((p) => ({ ...p, password: e.target.value }));
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="En az 8 karakter"
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
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Oluştur
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        title="Çalışanı Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">
              {deleteEmployee?.firstName} {deleteEmployee?.lastName}
            </span>{' '}
            adlı çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteEmployee(null)}
              disabled={deleteMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteEmployee && deleteMutation.mutate(deleteEmployee.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
