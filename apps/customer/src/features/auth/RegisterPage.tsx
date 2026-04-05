import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient, setAuthTokens } from '@stockbite/api-client';
import { authService } from '@stockbite/api-client';
import { Button, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    tenantName: '',
    slug: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleTenantNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      tenantName: value,
      slug: slugify(value),
    }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.tenantName.trim()) errs.tenantName = 'İşletme adı gereklidir.';
    if (!form.slug.trim()) errs.slug = 'Slug gereklidir.';
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      errs.slug = 'Slug sadece küçük harf, rakam ve tire içerebilir.';
    if (!form.email.trim()) errs.email = 'Email gereklidir.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Geçerli bir email girin.';
    if (!form.firstName.trim()) errs.firstName = 'Ad gereklidir.';
    if (!form.lastName.trim()) errs.lastName = 'Soyad gereklidir.';
    if (!form.password) errs.password = 'Şifre gereklidir.';
    else if (form.password.length < 6) errs.password = 'Şifre en az 6 karakter olmalıdır.';
    if (form.password !== form.passwordConfirm)
      errs.passwordConfirm = 'Şifreler eşleşmiyor.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const res = await apiClient.post('/api/auth/register', {
        tenantName: form.tenantName,
        slug: form.slug,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      const data = res.data;

      setAuthTokens(data.accessToken, data.refreshToken);

      const subscribedModules = await authService.getMyModules();
      login(data.user, data.accessToken, data.refreshToken, subscribedModules);

      toast.success(
        'Hesabınız oluşturuldu! Paket satın alarak modülleri aktifleştirebilirsiniz.',
        { duration: 5000 }
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data
          ?.message ??
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data
          ?.detail ??
        'Kayıt başarısız. Lütfen tekrar deneyin.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StockBite</h1>
          <p className="text-sm text-slate-500 mt-1">Restaurant Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Hesap Oluştur</h2>
          <p className="text-sm text-slate-500 mb-6">
            Restoranınız için ücretsiz hesap oluşturun.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                İşletme Adı
              </label>
              <input
                type="text"
                value={form.tenantName}
                onChange={(e) => handleTenantNameChange(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.tenantName ? 'border-red-400' : 'border-slate-300'
                }`}
                placeholder="Örnek Restoran"
                disabled={isLoading}
              />
              {errors.tenantName && (
                <p className="mt-1 text-xs text-red-500">{errors.tenantName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.slug ? 'border-red-400' : 'border-slate-300'
                }`}
                placeholder="ornek-restoran"
                disabled={isLoading}
              />
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.firstName ? 'border-red-400' : 'border-slate-300'
                  }`}
                  placeholder="Ali"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.lastName ? 'border-red-400' : 'border-slate-300'
                  }`}
                  placeholder="Yılmaz"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="ali@restoran.com"
              error={errors.email}
              disabled={isLoading}
            />

            <Input
              label="Şifre"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              error={errors.password}
              disabled={isLoading}
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
              placeholder="••••••••"
              error={errors.passwordConfirm}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full !bg-emerald-600 !hover:bg-emerald-700 focus:!ring-emerald-500"
            >
              Hesap Oluştur
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Giriş yapın
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          StockBite &copy; {new Date().getFullYear()} — Restaurant Management
        </p>
      </div>
    </div>
  );
}
