import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  ChevronRight, 
  Zap,
  Quote,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';

interface GeminiInsightProps {
  stats: {
    delivered: number;
    pending: number;
    cancelled: number;
    returned: number;
    hours: number;
    city: string;
  };
}

export const GeminiInsightModule: React.FC<GeminiInsightProps> = ({ stats }) => {
  const [insight, setInsight] = useState<string>('Esperando cierre de la jornada para realizar el diagnóstico cognitivo...');
  const [loading, setLoading] = useState(false);

  // Dynamic Efficiency Score Calculation
  const total = stats.delivered + stats.cancelled + stats.returned + stats.pending;
  const efficiencyScore = total > 0 ? Math.round((stats.delivered / total) * 100) : 0;

  const generateInsight = async () => {
    if (stats.pending > 0 || stats.delivered === 0) return;

    const cacheKey = `gemini_insight_${stats.delivered}_${stats.cancelled}_${stats.returned}_${stats.hours}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setInsight(cached);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/ai/daily-summary', {
        totalDelivered: stats.delivered,
        totalPending: stats.pending,
        totalCancelled: stats.cancelled,
        totalReturned: stats.returned,
        totalHours: stats.hours,
        city: stats.city,
        efficiencyScore: efficiencyScore
      });
      setInsight(data.summary);
      sessionStorage.setItem(cacheKey, data.summary);
    } catch (err) {
      setInsight("En este momento la IA está recalculando rutas globales. Por favor, intenta en unos minutos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stats.pending === 0 && stats.delivered > 0) {
      generateInsight();
    }
  }, [stats.delivered, stats.cancelled, stats.returned, stats.pending, stats.hours]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden group bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-200"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                <BrainCircuit className="text-indigo-400" size={24} />
             </div>
             <div>
                <h4 className="text-lg font-black tracking-tighter uppercase italic">Gemini <span className="text-indigo-400">Cognitive</span></h4>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Análisis de Desempeño IA</p>
             </div>
          </div>
          <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full flex items-center gap-2">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">En Línea</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
             <Quote className="text-indigo-400/50 shrink-0" size={32} />
             <div className="min-h-[100px] flex items-center">
                {loading ? (
                  <div className="flex items-center gap-3">
                     <Loader2 className="animate-spin text-indigo-400" size={24} />
                     <p className="text-slate-400 font-bold italic text-sm">Escaneando métricas de la jornada...</p>
                  </div>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-medium leading-relaxed text-indigo-50/90 italic"
                  >
                    "{insight}"
                  </motion.p>
                )}
             </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap gap-4">
           <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-1">Score de Eficiencia</p>
              <div className="flex items-center gap-2">
                 <Zap size={14} className="text-amber-400" />
                 <span className="text-xl font-black">{efficiencyScore}%</span>
              </div>
           </div>
           
           <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-1">Sugerencia</p>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                Mantener este ritmo <ChevronRight size={14} className="text-indigo-400" />
              </p>
           </div>
        </div>
      </div>

      <button 
        onClick={generateInsight}
        className="absolute bottom-8 right-8 w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group-hover:bg-indigo-400 group-hover:text-white"
      >
        <Sparkles size={20} />
      </button>
    </motion.div>
  );
};
