import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, BarChart3, Settings, LogOut, 
  Bell, Map as MapIcon, TrendingUp, Clock, MapPin, Calendar, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import { OrdersManagementModule } from '../../features/orders/OrdersManagementModule';

export const ManagerDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');
  
  const assignedCity = "Bogotá"; // En un sistema real vendría del perfil del coordinador

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="p-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 text-white">
            <MapIcon size={20} className="text-green-500" />
          </div>
          <div>
             <h1 className="font-black text-slate-900 tracking-tighter text-xl italic">Manager<span className="text-green-500">Local</span></h1>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sede {assignedCity}</p>
          </div>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-bold">Mando Local</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Package size={18} /> <span className="text-sm font-bold">Mis Pedidos</span>
          </button>
        </nav>
        <div className="p-8"><button onClick={() => { logout(); navigate('/'); }} className="w-full py-4 border-2 border-slate-100 text-slate-400 text-xs font-black uppercase rounded-2xl hover:border-red-500 hover:text-red-500 transition-all">Desconectarse</button></div>
      </aside>

      <main className="flex-1 ml-80 p-12">
        <header className="flex justify-between items-center mb-12">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 mb-2">
                 <Navigation size={12} /> Coordinador de Ciudad
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Sede {assignedCity}</h2>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Entregas de hoy</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">42</h3>
                  </div>
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center">
                     <TrendingUp size={30} />
                  </div>
               </div>
               <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-xl shadow-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Efectividad Sede</p>
                    <h3 className="text-4xl font-black tracking-tighter">94%</h3>
                  </div>
                  <div className="w-16 h-16 bg-white/10 text-white rounded-3xl flex items-center justify-center">
                     <Package size={30} />
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <OrdersManagementModule driverName="" forceCity={assignedCity} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
