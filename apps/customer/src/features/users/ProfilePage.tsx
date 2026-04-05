import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Pencil, X, Check, KeyRound } from 'lucide-react';
import { authService } from '@stockbite/api-client';
import { Badge, Button, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const infoMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({ firstName, lastName }),
    onSuccess: () => {
      updateUser({ firstName, lastName });
      toast.success('Bilgiler güncellendi');
      setEditingInfo(false);
    },
    onError: () => toast.error('Güncelleme başarısız'),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        firstName: user!.firstName,
        lastName: user!.lastName,
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast.success('Şifre güncellendi');
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    },
    onError: () => toast.error('Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.'),
  });

  function startEditInfo() {
    setFirstName(user!.firstName);
    setLastName(user!.lastName);
    setEditingInfo(true);
  }

  function cancelEditInfo() {
    setEditingInfo(false);
  }

  function submitInfo() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Ad ve soyad boş olamaz');
      return;
    }
    infoMutation.mutate();
  }

  function submitPassword() {
    if (newPassword.length < 8) {
      setPasswordError('Yeni şifre en az 8 karakter olmalıdır');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    setPasswordError('');
    passwordMutation.mutate();
  }

  if (!user) return null;

  return (
    <div className="p-6 space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hesap bilgilerinizi yönetin</p>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
                  {user.role === 'Owner' ? 'Sahip' : 'Çalışan'}
                </Badge>
              </div>
            </div>
          </div>
          {!editingInfo && (
            <Button variant="ghost" size="sm" onClick={startEditInfo}>
              <Pencil size={14} />
              Düzenle
            </Button>
          )}
        </div>

        {editingInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ad"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Soyad"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={cancelEditInfo}
                disabled={infoMutation.isPending}
              >
                <X size={14} />
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={submitInfo}
                isLoading={infoMutation.isPending}
              >
                <Check size={14} />
                Kaydet
              </Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500 mb-1">E-posta</dt>
              <dd className="text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 mb-1">Kullanıcı ID</dt>
              <dd className="text-slate-500 font-mono text-xs">{user.id}</dd>
            </div>
            {user.tenantId && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">Restoran ID</dt>
                <dd className="text-slate-500 font-mono text-xs">{user.tenantId}</dd>
              </div>
            )}
            {user.role === 'Employee' && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">İzinler</dt>
                <dd>
                  {user.permissions.length === 0 ? (
                    <span className="text-slate-400">İzin atanmamış</span>
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
        )}
      </div>

      {/* Password Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Şifre</h3>
          </div>
          {!editingPassword && (
            <Button variant="ghost" size="sm" onClick={() => setEditingPassword(true)}>
              <Pencil size={14} />
              Değiştir
            </Button>
          )}
        </div>

        {editingPassword ? (
          <div className="space-y-4">
            <Input
              label="Mevcut Şifre"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Yeni Şifre"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="En az 8 karakter"
            />
            <Input
              label="Yeni Şifre Tekrar"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="••••••••"
              error={passwordError}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                disabled={passwordMutation.isPending}
              >
                <X size={14} />
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={submitPassword}
                isLoading={passwordMutation.isPending}
              >
                <Check size={14} />
                Kaydet
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">••••••••</p>
        )}
      </div>
    </div>
  );
}
