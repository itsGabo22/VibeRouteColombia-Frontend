import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';

interface Order {
  id: number;
  address: string;
  city: string;
  clientReference: string;
}

export const BatchConsolidationModule: React.FC<{ city?: string; searchQuery?: string; onComplete: () => void }> = ({ city, searchQuery = '', onComplete }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPendingOrders = async () => {
    try {
      const { data } = await api.get('/orders/pending', { params: { city } });
      // Doble validación en frontend para evitar fugas entre ciudades
      const filtered = city 
        ? data.filter((o: any) => o.city?.toLowerCase() === city.toLowerCase())
        : data;
      setOrders(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, [city]);

  const displayOrders = orders.filter(o => 
    o.clientReference?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOrder = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === displayOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayOrders.map(o => o.id));
    }
  };

  const handleCreateBatch = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      await api.post('/batches/manual', { orderIds: selectedIds, city });
      onComplete();
    } catch (err) {
      alert("Error al crear el lote manual.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
               <Package size={28} className="text-teal-500" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 mb-1">Unidad de Consolidación</p>
               <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">
                 {orders.length} Pedidos <span className="text-slate-400">Listos</span>
               </h3>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button
               onClick={selectAll}
               className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-teal-400 transition-all"
            >
               {selectedIds.length === orders.length ? 'Desmarcar Todo' : 'Seleccionar Todo'}
            </button>
            <button
               onClick={handleCreateBatch}
               disabled={selectedIds.length === 0 || saving}
               className={`px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl disabled:opacity-20 ${selectedIds.length > 0 ? 'hover:bg-teal-600 active:scale-95' : ''}`}
            >
               {saving ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} className={selectedIds.length > 0 ? 'animate-pulse' : ''} />}
               Empaquetar {selectedIds.length} Pedidos
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {displayOrders
            .map((order) => (
           <motion.div
             key={order.id}
             layout
             onClick={() => toggleOrder(order.id)}
             className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${
               selectedIds.includes(order.id) ? 'border-teal-500 bg-teal-50/30' : 'border-slate-50 bg-white hover:border-slate-200'
             }`}
           >
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedIds.includes(order.id) ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle2 size={20} />
                 </div>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{order.id}</span>
              </div>
              
              <h4 className="text-sm font-black text-slate-800 mb-2 truncate" title={order.clientReference}>
                {order.clientReference || 'Ref: Sin Nombre'}
              </h4>
              
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <MapPin size={12} className="text-teal-400" />
                    <span className="truncate">{order.address}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <TrendingUp size={12} className="text-teal-400" />
                    <span>{order.city} Local</span>
                 </div>
              </div>
           </motion.div>
         ))}

         {orders.length === 0 && !loading && (
           <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">
              No hay pedidos pendientes de consolidación. 👋
           </div>
         )}
      </div>
    </div>
  );
};
