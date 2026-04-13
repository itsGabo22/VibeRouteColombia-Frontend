import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  TrendingUp, 
  Clock, 
  MapPin, 
  LogOut, 
  Navigation,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import { OrdersManagementModule } from '../../features/orders/OrdersManagementModule';

export const DriverDashboardPage: React.FC = () => {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'summary' | 'list'>('summary');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ delivered: 0, pending: 0 });
  const [nextOrder, setNextOrder] = useState<any>(null);

  const fetchData = async () => {
    try {
      const { data: batches } = await api.get('/batches');
      const myBatch = batches.find((b: any) => 
        b.driver && b.driver.email === user?.email && b.status !== 'COMPLETED'
      );

      if (myBatch && myBatch.orders) {
        const allOrders = myBatch.orders;
        setOrders(allOrders);
        const delivered = allOrders.filter((o: any) => o.status === 'DELIVERED').length;
        const pending = allOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'ON_ROUTE').length;
        setStats({ delivered, pending });
        const next = allOrders.find((o: any) => o.status === 'PENDING' || o.status === 'ON_ROUTE');
        setNextOrder(next);
      }
    } catch (err) {
      console.error("Error cargando datos del driver:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, [token, user?.email, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
        <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando Hoja de Ruta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 text-white">
                <Truck size={20} />
             </div>
             <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">
                  PANEL DEL <br/>
                  <span className="text-green-500">CONDUCTOR</span>
                </h1>
             </div>
          </div>
          <button onClick={handleLogout} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-6 space-y-8 pb-32">
        
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-slate-200 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=0f172a&color=fff`} alt="Avatar" />
           </div>
           <div>
              <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em] mb-0.5">Operación en curso</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Hola, {user?.name.split(' ')[0]}</h2>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'summary' ? (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-4">
                       <CheckCircle2 size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{stats.delivered}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entregados</p>
                 </div>
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4">
                       <Clock size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{stats.pending}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pendientes</p>
                 </div>
              </div>

              {nextOrder ? (
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                   <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-all duration-700">
                      <Navigation size={200} />
                   </div>
                   <div className="relative z-10 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                         Próximo Destino
                      </div>
                      <h4 className="text-2xl font-black tracking-tighter leading-tight">{nextOrder.address}</h4>
                      <p className="text-slate-400 text-sm font-medium">{nextOrder.city}, CO • REF: {nextOrder.clientReference}</p>
                      
                      <button 
                         onClick={() => setView('list')}
                         className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 mt-4 active:scale-95 transition-all shadow-xl shadow-white/10"
                      >
                         Iniciar Navegación <Navigation size={16} className="text-green-500" />
                      </button>
                   </div>
                </div>
              ) : (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white p-10 rounded-[3rem] text-center shadow-2xl shadow-green-100 border border-green-50 relative overflow-hidden"
                >
                   <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-300 via-green-500 to-green-300"></div>
                   <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200">
                      <CheckCircle2 size={48} />
                   </div>
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">¡Misión Cumplida!</h3>
                   <p className="text-slate-400 font-bold text-sm mb-10 max-w-[200px] mx-auto">Has completado todas las entregas de tu lote asignado.</p>
                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="p-6 bg-slate-50 rounded-3xl">
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Entregas</p>
                         <p className="text-2xl font-black text-green-600">{stats.delivered}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl">
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Eficiencia</p>
                         <p className="text-2xl font-black text-slate-900">100%</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => window.location.reload()}
                      className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                   >
                      Sincronizar nueva jornada
                   </button>
                </motion.div>
              )}

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-4 shadow-sm">
                 <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shrink-0">
                    <TrendingUp size={20} />
                 </div>
                 <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimización de Ruta</h5>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                       {stats.pending > 0 
                         ? `Tienes ${stats.pending} entregas por delante. Mantén un promedio de 15 minutos por parada para finalizar a tiempo.`
                         : "Excelente jornada. Todo está entregado y sincronizado con la central."
                       }
                    </p>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="list"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
               <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setView('summary')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
                     ← Resumen
                  </button>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Tu Hoja de Ruta</h3>
               </div>
               <OrdersManagementModule driverName={user?.name || ''} onUpdate={fetchData} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <footer className="bg-white border-t border-slate-100 p-4 fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
           <button 
             onClick={() => setView('summary')}
             className={`py-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${view === 'summary' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}
           >
              <LayoutDashboard size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Mi Turno</span>
           </button>
           <button 
             onClick={() => setView('list')}
             className={`py-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}
           >
              <Package size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Mis Pedidos</span>
           </button>
        </div>
      </footer>
    </div>
  );
};
