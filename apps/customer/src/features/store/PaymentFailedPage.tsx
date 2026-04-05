import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export function PaymentFailedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <XCircle className="text-red-500" size={64} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödeme Başarısız</h1>
        <p className="text-slate-500 mb-6">
          Ödemeniz gerçekleştirilemedi. Lütfen kart bilgilerinizi kontrol ederek tekrar
          deneyin.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/store')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Mağazaya Dön
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
