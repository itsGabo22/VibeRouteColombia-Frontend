import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

interface DestructiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DestructiveActionModal: React.FC<DestructiveActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  itemName,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(244,63,94,0.3)]"
        >
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                <ShieldAlert size={24} />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>

            {itemName && (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <p className="text-xs font-bold text-rose-400/80 leading-relaxed italic">
                  Estás a punto de eliminar permanentemente a: <span className="text-rose-400 underline">{itemName}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Escribe <span className="text-rose-500">"{confirmText}"</span> para continuar
                </label>
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmText}
                  className="w-full bg-slate-950 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all text-sm font-black text-rose-500 tracking-[0.2em]"
                />
              </div>

              <button
                disabled={isLoading || inputValue.toUpperCase() !== confirmText.toUpperCase()}
                onClick={() => {
                  onConfirm();
                  setInputValue('');
                }}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-900/20 active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <X size={16} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Eliminación Crítica'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
