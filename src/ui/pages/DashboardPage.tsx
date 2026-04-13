import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import { DriverOrdersModule } from '../../features/orders/DriverOrdersModule';

export const DashboardPage: React.FC = () => {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'fleet' | 'analytics'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      // Solo cargamos estadísticas si NO es un repartidor para evitar 403
      if (user?.role === 'DRIVER') {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/analytics/delivery-summary');
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, navigate, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'orders', label: 'Gestión de Pedidos', icon: Package },
    { id: 'fleet', label: 'Seguimiento Flota', icon: Truck, roles: ['ADMIN', 'LOGISTICS'] },
    { id: 'analytics', label: 'Reportes IA', icon: BarChart3, roles: ['ADMIN', 'LOGISTICS'] },
  ];

  // Filtramos los items del menú según el rol real
  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-green-100">
      
      {/* Sidebar - Diseño Minimalista Premium */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="p-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Package className="text-white" size={20} />
          </div>
          <div>
             <h1 className="font-black text-slate-900 tracking-tighter text-xl">Vibe<span className="text-green-500 italic">Route</span></h1>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Colombia Ops</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 mt-4">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all group relative ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-green-400' : 'group-hover:text-slate-600'} />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="nav-pill" className="absolute right-4 w-1.5 h-1.5 bg-green-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="p-6 bg-slate-900 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Settings className="text-white" size={40} />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Sesión Activa</p>
               <h4 className="text-white font-black text-sm tracking-tight truncate">{user?.email}</h4>
               <button 
                 onClick={handleLogout}
                 className="mt-4 flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-300 transition-colors"
               >
                 <LogOut size={14} /> Finalizar Turno
               </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] bg-green-50 px-3 py-1.5 rounded-full mb-3 inline-block">Sincronización Regional Activa</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
              {activeTab === 'overview' && `Bienvenido, ${user?.name || 'Operario'}`}
              {activeTab === 'orders' && 'Gestión Operativa de Pedidos'}
              {activeTab === 'fleet' && 'Seguimiento de Flota (Real-Time)'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 text-xs font-bold">
                <Calendar size={14} className="text-green-500" />
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
             </div>
             <button className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 hover:text-green-500 transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-green-500 transition-all">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-all">
                    <TrendingUp size={24} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Entregas de hoy</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                    {user?.role === 'DRIVER' ? '12' : (stats?.todayDeliveries || '0')}
                  </h3>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-blue-500 transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Clock size={24} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Tiempo Promedio</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">24m</h3>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-amber-500 transition-all">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <MapPin size={24} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ruta más activa</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">Bogotá D.C.</h3>
                </div>
              </div>

              {/* Botón rápido para ir a pedidos si es Driver */}
              {user?.role === 'DRIVER' && (
                <div className="p-10 bg-gradient-to-br from-green-500 to-green-600 rounded-[3rem] text-white flex justify-between items-center shadow-2xl shadow-green-200">
                   <div className="space-y-2">
                      <h3 className="text-3xl font-black tracking-tighter italic">¡Tienes 12 pedidos pendientes!</h3>
                      <p className="text-green-100 text-sm font-medium">Inicia tu ruta ahora para cumplir con el SLA nacional.</p>
                   </div>
                   <button 
                     onClick={() => setActiveTab('orders')}
                     className="px-8 py-4 bg-white text-green-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                   >
                     Módulo de Carga <ChevronRight size={16} />
                   </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
               key="orders"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
               <DriverOrdersModule driverName={user?.name || ''} />
            </motion.div>
          )}

          {(activeTab === 'fleet' || activeTab === 'analytics') && (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4">
                  <Settings className="animate-pulse" />
               </div>
               <h4 className="text-slate-400 font-bold mb-1">Módulo en Desarrollo</h4>
               <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Infraestructura Progresiva VibeRoute</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
