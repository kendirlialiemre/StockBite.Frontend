import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService, setAuthTokens } from '@stockbite/api-client';
import { Button, Input } from '@stockbite/ui';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  function validate() {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
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
      const res = await authService.login({ email, password });

      if (res.user.role === 'SuperAdmin') {
        toast.error('Lütfen Admin Paneli üzerinden giriş yapın.');
        return;
      }

      // Token'ı kaydet ki modül isteği auth header gönderebilsin
      setAuthTokens(res.accessToken, res.refreshToken);

      // Tenant'ın aktif modüllerini çek
      const subscribedModules = await authService.getMyModules();
      login(res.user, res.accessToken, res.refreshToken, subscribedModules);

      toast.success(`Hoş geldiniz, ${res.user.firstName}!`);
      navigate('/dashboard');
    } catch {
      toast.error('Email veya şifre hatalı.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-200">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StockBite</h1>
          <p className="text-sm text-slate-500 mt-1">Restoran Yönetim Platformu</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Giriş Yap</h2>
          <p className="text-sm text-slate-400 mb-6">
            Restoranınıza erişmek için bilgilerinizi girin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siz@restoran.com"
              error={errors.email}
              required
              disabled={isLoading}
            />
            <Input
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full !bg-violet-600 hover:!bg-violet-700"
            >
              Giriş Yap
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
            Kayıt olun
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          StockBite &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
