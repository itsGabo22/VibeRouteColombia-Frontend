import React, { useState, useEffect } from 'react';
import { 
  Package, 
  UserPlus, 
  MapPin, 
  FileDown, 
  Users, 
  TrendingUp, 
  Search,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';

interface Batch {
  id: number;
  status: string;
  orders: any[];
  driver?: { id: number; name: string };
}

interface Driver {
  id: number;
  name: string;
  status: string;
}

export const LogisticsDispatchCenter: React.FC<{ city?: string; searchQuery?: string }> = ({ city, searchQuery = '' }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [{ data: pendingBatches }, { data: allDrivers }, { data: topDrivers }] = await Promise.all([
        api.get('/batches/pending', { params: { city } }),
        api.get('/drivers'),
        api.get('/stats/driver-ranking')
      ]);
      setBatches(pendingBatches);
      setDrivers(allDrivers.filter((d: any) => d.status === 'AVAILABLE'));
      setRanking(topDrivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [city]);

  const handleAssign = async (driverId: number) => {
    if (!selectedBatch) return;
    setAssigning(true);
    try {
      await api.post(`/batches/${selectedBatch.id}/assign-driver/${driverId}`);
      setSelectedBatch(null);
      fetchData();
    } catch (err) {
      alert("Error al asignar el conductor.");
    } finally {
      setAssigning(false);
    }
  };

  const generatePDF = (batchId: number) => {
    alert(`Generando Manifiesto PDF para Lote #${batchId}... En una app real, esto descargaría un archivo generado por iText en el Backend.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      
      {/* Columna 1: Lotes Pendientes */}
      <div className="lg:col-span-2 space-y-6">
         <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">Lotes por Despachar</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronizado con Almacén Central</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
               <Package size={24} />
            </div>
         </div>

         <div className="space-y-4">
            {batches
              .filter(b => b.id.toString().includes(searchQuery) || b.orders.some(o => o.clientReference?.toLowerCase().includes(searchQuery.toLowerCase())))
              .map((batch) => (
              <motion.div 
                key={batch.id}
                layoutId={`batch-${batch.id}`}
                onClick={() => setSelectedBatch(batch)}
                className={`p-6 bg-white rounded-[2rem] border transition-all cursor-pointer ${
                  selectedBatch?.id === batch.id ? 'border-teal-500 ring-4 ring-teal-50 shadow-xl' : 'border-slate-50 hover:border-teal-200'
                }`}
              >
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xs font-black">
                          #{batch.id}
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-800">Carga Masiva: {batch.orders.length} Pedidos</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                             <MapPin size={10} /> {batch.orders[0]?.city || 'Varios Destinos'}
                          </p>
                       </div>
                    </div>
                    <ChevronRight className={selectedBatch?.id === batch.id ? 'text-teal-500' : 'text-slate-200'} />
                 </div>
              </motion.div>
            ))}
            {batches.length === 0 && !loading && (
              <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">
                 No hay lotes pendientes de asignación.
              </div>
            )}
         </div>
      </div>

      {/* Columna 2: Pool de Conductores & Asignación */}
      <div className="space-y-6">
         <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform">
               <Users size={160}/>
            </div>
            <h4 className="text-lg font-black tracking-tighter uppercase italic mb-6">Conductores Disponibles</h4>
            
            <AnimatePresence mode="wait">
               {selectedBatch ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                     <p className="text-[10px] text-teal-400 font-black uppercase tracking-widest mb-4">Selecciona repartidor para Batch #{selectedBatch.id}</p>
                     <div className="space-y-3">
                        {drivers
                          .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(driver => (
                          <button 
                            key={driver.id}
                            onClick={() => handleAssign(driver.id)}
                            disabled={assigning}
                            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-left"
                          >
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-teal-500/30 overflow-hidden">
                                   <img src={`https://ui-avatars.com/api/?name=${driver.name}&background=10b981&color=fff`} alt="" />
                                </div>
                                <div>
                                   <p className="text-xs font-black">{driver.name}</p>
                                   <p className="text-[8px] uppercase font-bold text-slate-500">98% Eficiencia</p>
                                </div>
                             </div>
                             <ArrowRight size={14} className="text-teal-400" />
                          </button>
                        ))}
                     </div>
                     <button onClick={() => setSelectedBatch(null)} className="w-full py-4 text-[9px] font-black uppercase text-slate-500">Cancelar Asignación</button>
                  </motion.div>
               ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <UserPlus size={24} />
                     </div>
                     <p className="text-[10px] font-black uppercase text-slate-400">Selecciona un lote de la izquierda <br/>para asignar un conductor</p>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Nueva Sección: Mejores Trabajadores (Real Data) */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Destacado</h4>
            <div className="space-y-4">
               {ranking.slice(0,3).map((best, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                       <div>
                          <p className="text-[10px] font-black">{best.driverName}</p>
                          <p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest">{best.effectivenessPercentage}% Eficiencia</p>
                       </div>
                    </div>
                 </div>
               ))}
               <button onClick={() => generatePDF(0)} className="w-full flex items-center justify-between p-5 bg-teal-50 text-teal-600 rounded-3xl group hover:bg-teal-600 hover:text-white transition-all shadow-xl mt-6">
                  <div className="flex items-center gap-4 text-left">
                     <FileDown size={20} />
                     <div>
                        <p className="text-xs font-black">Planilla Semanal</p>
                        <p className="text-[9px] font-bold uppercase opacity-60">PDF Consolidado</p>
                     </div>
                  </div>
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};
