import React from 'react';
import { Circle } from 'lucide-react';

interface PasswordCriteriaChecklistProps {
  visible: boolean;
}

const CRITERIA_LABELS = [
  'Mínimo 8 caracteres',
  'Al menos una mayúscula',
] as const;

export const PasswordCriteriaChecklist: React.FC<PasswordCriteriaChecklistProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className="mt-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3"
      role="status"
      aria-live="polite"
    >
      <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Requisitos de seguridad
      </p>
      <ul className="space-y-1.5">
        {CRITERIA_LABELS.map((label) => (
          <li key={label} className="flex items-center gap-2 text-xs text-slate-400">
            <Circle size={14} className="shrink-0 text-slate-600" aria-hidden />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
