import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, BarChart3, Settings, LogOut, 
  Bell, Map as MapIcon, TrendingUp, Clock, MapPin, Calendar, Navigation, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import { OrdersManagementModule } from '../../features/orders/OrdersManagementModule';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');

  return (
    <div className="min-h-screen bg-white flex font-sans">
      <aside className="w-80 bg-slate-900 flex flex-col fixed h-full z-20 overflow-hidden">
        <div className="p-10 flex items-center gap-3 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl opacity-50" />
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 text-white relative">
            <Globe size={20} className="text-green-400" />
          </div>
          <div className="relative">
             <h1 className="font-black text-white tracking-tighter text-xl italic leading-none">Vibe<span className="text-green-500">Route</span></h1>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Control Central</p>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-bold">Mando Nacional</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Package size={18} /> <span className="text-sm font-bold">Gestión de Pedidos</span>
          </button>
        </nav>

        <div className="p-8 mt-auto border-t border-white/5 bg-black/20">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-800 rounded-full border border-white/10 overflow-hidden">
                 <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=1e293b&color=fff`} alt="Admin" />
              </div>
              <div>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Administrador</p>
                 <p className="text-sm font-bold text-white tracking-tight leading-none">{user?.name}</p>
              </div>
           </div>
           <button onClick={() => { logout(); navigate('/'); }} className="w-full py-4 bg-red-500/10 text-red-400 text-xs font-black uppercase rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-12 bg-slate-50/50 min-h-screen">
        <header className="flex justify-between items-center mb-12">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 mb-2">
                 <Navigation size={12} /> Operación Nacional
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard <span className="text-green-500 italic">Central</span></h2>
           </div>
           <div className="flex gap-4">
              <button className="p-4 bg-white border border-slate-100 rounded-[1.5rem] text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                 <Bell size={20} />
              </button>
              <button className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                 <BarChart3 size={20} className="text-green-400" />
                 <span className="text-xs font-black uppercase tracking-widest">Descargar Reporte</span>
              </button>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-10">Pedidos del Mes</p>
                     <div className="flex items-end justify-between">
                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">1,280</h3>
                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                           <TrendingUp size={24} />
                        </div>
                     </div>
                  </div>
                  <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-10">Conductores Activos</p>
                     <div className="flex items-end justify-between">
                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">42</h3>
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                           <Truck size={24} />
                        </div>
                     </div>
                  </div>
                  <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl shadow-slate-200 flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <MapIcon size={120} />
                     </div>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-10">Efectividad Global</p>
                     <div className="flex items-end justify-between relative z-10">
                        <h3 className="text-5xl font-black tracking-tighter italic">98.2%</h3>
                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/10">
                           <BarChart3 size={24} />
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-300 via-green-500 to-green-300"></div>
                  <div className="flex justify-between items-center mb-10">
                     <h4 className="text-xl font-black text-slate-900 tracking-tight italic">Últimos Movimientos en el Mapa</h4>
                     <button className="text-[10px] font-black uppercase tracking-widest text-green-600 border-b-2 border-green-500 pb-1">Ver Mapa Completo</button>
                  </div>
                  <div className="h-64 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center flex-col gap-4">
                     <div className="p-4 bg-white rounded-2xl shadow-sm text-green-500 animate-pulse">
                        <MapIcon size={32} />
                     </div>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Cargando red logística en tiempo real...</p>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="mb-10 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Control Maestro de Pedidos</h3>
               </div>
               <OrdersManagementModule driverName="" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
