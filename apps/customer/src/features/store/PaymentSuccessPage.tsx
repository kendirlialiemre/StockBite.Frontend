import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authService } from '@stockbite/api-client';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { setSubscribedModules } = useAuthStore();

  useEffect(() => {
    async function refreshModules() {
      try {
        const modules = await authService.getMyModules();
        setSubscribedModules(modules);
        toast.success('Modülleriniz aktifleştirildi!');
      } catch {
        // ignore — not critical
      }
    }
    refreshModules();
  }, [setSubscribedModules]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-emerald-500" size={64} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödeme Başarılı!</h1>
        <p className="text-slate-500 mb-6">
          Ödemeniz başarıyla tamamlandı. Satın aldığınız paketteki modüller hesabınıza
          aktifleştirildi.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Dashboard'a Git
        </button>
      </div>
    </div>
  );
}
