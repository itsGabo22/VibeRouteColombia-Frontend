import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MapPin, Truck, CheckCircle2, Download, AlertCircle, Loader2, FileText } from 'lucide-react';
import api from '../../shared/lib/api';

interface Order {
  id: number;
  address: string;
  city: string;
}

interface Cluster {
  suggestedDriverId: number;
  suggestedDriverName: string;
  driverStatus: string;
  zoneName: string;
  orders: Order[];
  centroidLat: number;
  centroidLng: number;
}

interface SmartDispatchPlan {
  aiReport: string;
  primaryClusters: Cluster[];
  alternativeClusters: Cluster[];
}

interface SmartDispatchModalProps {
  plan: SmartDispatchPlan;
  onClose: () => void;
  onComplete: () => void;
}

export const SmartDispatchModal: React.FC<SmartDispatchModalProps> = ({ plan, onClose, onComplete }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'PRIMARY' | 'ALTERNATIVE'>('PRIMARY');
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeClusters = selectedStrategy === 'PRIMARY' ? plan.primaryClusters : plan.alternativeClusters;

  const handleApply = async () => {
    setSaving(true);
    try {
      const selectedClusters = selectedStrategy === 'ALTERNATIVE' 
        ? plan.alternativeClusters 
        : plan.primaryClusters;

      const payload = {
        clusters: selectedClusters.map(c => ({
          orderIds: c.orders.map(o => o.id),
          driverId: c.suggestedDriverId
        }))
      };

      await api.post('/batches/smart-dispatch/apply', payload);
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Error al aplicar el plan inteligente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    const blob = new Blob([plan.aiReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VibeRoute_Reporte_IA_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    // Generamos un HTML básico que Word pueda interpretar
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Reporte IA</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 40pt; }
        h1 { color: #4f46e5; text-transform: uppercase; font-size: 18pt; border-bottom: 1px solid #eee; padding-bottom: 10pt; }
        p { margin-bottom: 10pt; font-size: 11pt; }
        strong { color: #1e293b; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>VibeRoute: Reporte Estratégico de Despacho</h1>
        ${plan.aiReport.split('\n').map(line => {
          const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return line.trim() === '' ? '<br/>' : `<p>${formatted}</p>`;
        }).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VibeRoute_Reporte_IA_${new Date().getTime()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-100"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                 <Bot size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                    Despacho <span className="text-indigo-500">Inteligente</span>
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Zonificación K-Means & Gemini</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600 transition-all font-black text-[10px] uppercase tracking-widest">
              Cerrar
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Columna Izquierda: Reporte de IA y Estrategia */}
          <div className="md:col-span-1 space-y-6">
             <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 relative overflow-hidden group">
                <Bot className="absolute -top-2 -right-2 text-indigo-100 rotate-12 transition-transform group-hover:rotate-0" size={80} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3 flex items-center gap-2">
                   <AlertCircle size={14} /> Análisis de IA
                </h3>
                
                <div className={`relative transition-all duration-500 ${isExpanded ? 'max-h-[1000px]' : 'max-h-[220px] overflow-hidden'}`}>
                   <div className="text-[11px] text-slate-600 leading-relaxed font-medium relative z-10 whitespace-pre-line font-sans">
                      {plan.aiReport.split('\n').map((line, i) => {
                        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        return <p key={i} className={`${line.trim() === '' ? 'h-3' : 'mb-2'}`} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                      })}
                   </div>
                   
                   {!isExpanded && (
                     <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-50 to-transparent z-20" />
                   )}
                </div>

                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative z-30 w-full mt-2 py-2 text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 transition-colors flex items-center justify-center gap-1"
                >
                   {isExpanded ? 'Ver menos' : 'Expandir análisis completo'}
                   <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>▼</motion.span>
                </button>

                <div className="flex flex-col gap-2 mt-6 relative z-30">
                  <div className="flex gap-2">
                    <button onClick={handleDownloadReport} className="flex-1 py-3 bg-white text-slate-600 rounded-xl border border-slate-200 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                      <FileText size={14} /> TXT
                    </button>
                    <button onClick={handleDownloadWord} className="flex-1 py-3 bg-white text-indigo-600 rounded-xl border border-indigo-200 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all">
                      <Download size={14} /> Word
                    </button>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                  >
                    <FileText size={14} /> Descargar Reporte PDF
                  </button>
                </div>

        {/* Contenedor Oculto para Impresión PDF Perfecta */}
        <div id="printable-report" className="hidden-print-only">
          <div className="print-page">
            <div className="print-header">
              <h1>VibeRoute</h1>
              <div className="print-meta">
                <span className="print-subtitle">Análisis Estratégico de Despacho</span>
                <span className="print-date">{new Date().toLocaleDateString()} | Pasto</span>
              </div>
            </div>
            
            <div className="print-body">
              {plan.aiReport.split('\n').map((line, i) => {
                const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                if (line.trim() === '') return <div key={i} className="print-spacer" />;
                if (line.startsWith('###')) {
                  return <h2 key={i} className="print-title">{line.replace('###', '').trim()}</h2>;
                }
                return <p key={i} className="print-text" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
              })}
            </div>

            <div className="print-footer">
              <p>Este documento es un análisis automatizado generado por VibeRoute IA Consultoría.</p>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .hidden-print-only { display: none; }
          @media print {
            @page { margin: 1.5cm; size: auto; }
            body * { visibility: hidden !important; }
            .hidden-print-only, .hidden-print-only * { visibility: visible !important; }
            .hidden-print-only { 
              display: block !important; 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              background: white;
            }
            .print-page { padding: 10px; font-family: 'Segoe UI', sans-serif; color: #1e293b; }
            .print-header { border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
            .print-header h1 { color: #4f46e5; margin: 0; font-size: 32pt; font-weight: 800; letter-spacing: -1px; }
            .print-meta { display: flex; justify-content: space-between; margin-top: 5px; }
            .print-subtitle { font-weight: 700; text-transform: uppercase; font-size: 9pt; color: #64748b; }
            .print-date { font-size: 9pt; color: #94a3b8; }
            .print-body { font-size: 11pt; line-height: 1.6; text-align: justify; }
            .print-title { color: #4f46e5; font-size: 16pt; margin-top: 25px; margin-bottom: 12px; border-left: 5px solid #4f46e5; padding-left: 15px; }
            .print-text { margin-bottom: 10px; }
            .print-spacer { height: 8px; }
            .print-footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; text-align: center; }
          }
        `}} />
             </div>

             <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Elegir Estrategia</h3>
                <button 
                  onClick={() => setSelectedStrategy('PRIMARY')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedStrategy === 'PRIMARY' ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-slate-800 uppercase tracking-tight text-sm">Opción Principal</span>
                      {selectedStrategy === 'PRIMARY' && <CheckCircle2 size={16} className="text-teal-500" />}
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold">Conductores Libres (AVAILABLE)</p>
                </button>

                {plan.alternativeClusters && plan.alternativeClusters.length > 0 && (
                  <button 
                    onClick={() => setSelectedStrategy('ALTERNATIVE')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedStrategy === 'ALTERNATIVE' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-800 uppercase tracking-tight text-sm">Opción Alternativa</span>
                        {selectedStrategy === 'ALTERNATIVE' && <CheckCircle2 size={16} className="text-amber-500" />}
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold">Empalme (Conductores EN RUTA)</p>
                  </button>
                )}
             </div>
          </div>

          {/* Columna Derecha: Zonas */}
          <div className="md:col-span-3 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Zonas Generadas ({activeClusters.length})
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                   {activeClusters.map((cluster, idx) => (
                     <motion.div
                       key={idx}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
                     >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] -z-10 transition-all group-hover:scale-110"></div>
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">
                              Z{idx + 1}
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cluster.orders.length} Pedidos</p>
                              <p className="text-sm font-black text-slate-800">{cluster.zoneName || 'Zona Detectada'}</p>
                           </div>
                        </div>

                        <div className="space-y-3">
                            <div className={`p-3 rounded-xl border flex items-center gap-3 ${cluster.suggestedDriverName ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-100'}`}>
                               <Truck size={14} className={cluster.suggestedDriverName ? 'text-teal-500' : 'text-amber-500'} />
                               <div className="flex-1">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Asignación Sugerida</p>
                                  <p className={`text-xs font-black ${cluster.suggestedDriverName ? 'text-slate-800' : 'text-amber-600'}`}>
                                    {cluster.suggestedDriverName || '⚠ Sin asignar — No hay conductores libres'}
                                  </p>
                               </div>
                               {cluster.driverStatus && (
                                 <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${
                                   cluster.driverStatus === 'AVAILABLE' ? 'bg-teal-100 text-teal-700'
                                   : cluster.driverStatus === 'ON_ROUTE' ? 'bg-indigo-100 text-indigo-700'
                                   : 'bg-slate-100 text-slate-600'
                                 }`}>
                                   {cluster.driverStatus === 'AVAILABLE' ? 'Libre' : cluster.driverStatus === 'ON_ROUTE' ? 'En Ruta' : cluster.driverStatus}
                                 </span>
                               )}
                            </div>
                           
                           <div className="max-h-24 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                              {cluster.orders.map(o => (
                                <div key={o.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                   <MapPin size={10} className="text-slate-300" />
                                   <span className="truncate">{o.address}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </AnimatePresence>
             </div>
             {activeClusters.length === 0 && (
               <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                 <p className="text-slate-400 font-bold text-sm">No hay zonas para esta estrategia.</p>
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
           <button 
             onClick={handleApply}
             disabled={saving || activeClusters.length === 0}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-50"
           >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Aprobar y Despachar Zonas
           </button>
        </div>
      </motion.div>
    </div>
  );
};
