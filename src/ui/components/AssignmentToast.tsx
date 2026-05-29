import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AssignmentToastProps {
  isOpen: boolean;
  message: string;
}

export const AssignmentToast: React.FC<AssignmentToastProps> = ({
  isOpen,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 max-w-sm px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-teal-900/10"
    >
      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
        <CheckCircle2 size={22} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
          Asignación exitosa
        </p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{message}</p>
      </div>
    </div>
  );
};
