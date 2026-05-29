import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface AssignmentToastProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 4000;

export const AssignmentToast: React.FC<AssignmentToastProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const timerId = window.setTimeout(() => {
      onClose();
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timerId);
  }, [isOpen, message, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 max-w-sm px-5 py-4 pr-10 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-teal-900/10"
    >
      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
        <CheckCircle2 size={22} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
          Asignación exitosa
        </p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
