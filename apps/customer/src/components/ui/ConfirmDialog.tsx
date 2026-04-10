import { Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  title?: string;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Sil',
  title = 'Emin misin?',
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <h2 className="font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-600">{message}</p>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Vazgeç
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className="flex-1 py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
