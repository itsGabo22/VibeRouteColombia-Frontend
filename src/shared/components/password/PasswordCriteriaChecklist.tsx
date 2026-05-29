import React from 'react';
import { Check, Circle } from 'lucide-react';
import { evaluatePasswordCriteria } from '../../lib/passwordValidation';

interface PasswordCriteriaChecklistProps {
  visible: boolean;
  value: string;
}

const CRITERIA = [
  { id: 'minLength' as const, label: 'Mínimo 8 caracteres' },
  { id: 'uppercase' as const, label: 'Al menos una mayúscula' },
];

export const PasswordCriteriaChecklist: React.FC<PasswordCriteriaChecklistProps> = ({
  visible,
  value,
}) => {
  if (!visible) return null;

  const results = evaluatePasswordCriteria(value);

  return (
    <div
      className="mt-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-3.5"
      role="status"
      aria-live="polite"
      aria-label="Requisitos de contraseña segura"
    >
      <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Requisitos de seguridad
      </p>
      <ul className="space-y-1.5">
        {CRITERIA.map(({ id, label }) => {
          const met = results[id];
          return (
            <li
              key={id}
              className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                met ? 'text-green-400' : 'text-red-400/80'
              }`}
            >
              {met ? (
                <Check size={14} className="shrink-0 text-green-400" aria-hidden />
              ) : (
                <Circle size={14} strokeWidth={1.5} className="shrink-0 text-slate-600" aria-hidden />
              )}
              <span>{label}</span>
              <span className="sr-only">{met ? 'cumplido' : 'pendiente'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
