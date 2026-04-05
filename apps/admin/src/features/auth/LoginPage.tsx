import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '@stockbite/api-client';
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
      if (res.user.role !== 'SuperAdmin') {
        toast.error('Erişim reddedildi. Bu panel yalnızca SuperAdmin içindir.');
        return;
      }
      login(res.user, res.accessToken, res.refreshToken);
      toast.success('Hoş geldiniz!');
      navigate('/dashboard');
    } catch {
      toast.error('Email veya şifre hatalı.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StockBite</h1>
          <p className="text-sm text-slate-500 mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Sign in
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your credentials to access the admin panel
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stockbite.io"
              error={errors.email}
              required
              disabled={isLoading}
            />
            <Input
              label="Password"
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
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          StockBite &copy; {new Date().getFullYear()} — Super Admin Portal
        </p>
      </div>
    </div>
  );
}
