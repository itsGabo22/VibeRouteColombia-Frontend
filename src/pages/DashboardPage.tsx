import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  Package,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  MapPin,
  Calendar,
  LayoutDashboard,
  Truck,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../app/store/authStore';
import api from '../shared/lib/api';

// Interface matching the backend /analytics/delivery-summary response fields
interface DeliveryStats {
  deliveriesToday: number;
  deliveriesThisWeek: number;
  deliveriesThisMonth: number;
  byCity: Record<string, number>;
}

interface DriverRanking {
  driverName: string;
  successfulDeliveries: number;
  effectivenessPercentage: number;
  tag: string;
}

export const DashboardPage: React.FC = () => {
  const { email, role, logout } = useAuthStore();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [ranking, setRanking] = useState<DriverRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, rankingRes] = await Promise.all([
          api.get('/analytics/delivery-summary'),
          api.get('/analytics/driver-ranking'),
        ]);
        setStats(statsRes.data);
        setRanking(rankingRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const navItems = [
    { name: 'Panel Principal', icon: LayoutDashboard, active: true },
    { name: 'Gestión de Ruta', icon: Truck, active: false },
    { name: 'Envíos Nacionales', icon: Package, active: false },
    { name: 'Personal', icon: Users, active: false },
    { name: 'Configuración', icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-text-primary">

      {/* Sidebar navigation */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-border z-50 flex flex-col shadow-xl lg:shadow-none"
          >
            <div className="p-8 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-tight">VibeRoute</span>
                <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Colombia v1.0</span>
              </div>
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${item.active
                    ? 'bg-primary/10 text-primary-dark shadow-sm'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`}
                >
                  <item.icon size={20} className={`${item.active ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                  <span className="text-sm font-bold tracking-tight">{item.name}</span>
                  {item.active && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(46,204,127,1)]" />}
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-border">
              <div className="bg-primary/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase">
                  <HelpCircle size={14} /> Soporte Técnico
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">¿Necesitas ayuda con la logística nacional?</p>
                <button className="w-full py-2 bg-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-border hover:bg-primary hover:text-white transition-all">Manual v1</button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-screen overflow-hidden overflow-y-auto relative">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-8 py-5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-text-secondary"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-gray-100/50 px-4 py-2.5 rounded-2xl border border-border group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search size={18} className="text-gray-400 group-focus-within:text-primary" />
              <input type="text" placeholder="Buscar guías, conductores..." className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-sm font-black tracking-tight">{email?.split('@')[0]}</span>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">{role} COLOMBIA</span>
            </div>

            <button className="p-2.5 bg-gray-100/50 border border-border rounded-xl hover:bg-white hover:shadow-md transition-all relative">
              <Bell size={20} className="text-text-secondary" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="w-px h-8 bg-border" />

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-danger transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-200"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 space-y-4">

          {/* Welcome Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black tracking-tighter text-text-primary"
              >
                Buen día, <span className="text-primary italic">Operador.</span>
              </motion.h2>
              <div className="flex items-center gap-4 mt-2 text-text-secondary text-sm font-medium">
                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> Red Nacional de Colombia</div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
            </div>

            <button className="flex items-center gap-2 bg-primary px-6 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Package size={18} /> Nueva Remisión Nacional
            </button>
          </div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              { label: 'Entregas Hoy', value: stats?.deliveriesToday ?? 0, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Esta Semana', value: stats?.deliveriesThisWeek ?? 0, icon: BarChart3, color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'Cierre Mensual', value: stats?.deliveriesThisMonth ?? 0, icon: Package, color: 'text-danger', bg: 'bg-danger/10' },
              { label: 'Efectividad', value: '98.2%', icon: TrendingUp, color: 'text-primary-dark', bg: 'bg-primary-dark/10' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <card.icon size={24} strokeWidth={2.5} />
                  </div>
                  <p className="text-text-secondary text-xs font-black uppercase tracking-widest mb-1">{card.label}</p>
                  <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Driver Ranking */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border shadow-sm flex flex-col overflow-hidden">
              <div className="p-8 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Efectividad de Repartidores</h3>
                  <p className="text-sm font-medium text-text-secondary">Top 10 Nacional / Acumulado Tiempo Real</p>
                </div>
                <button className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                  Ver Todos <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-text-secondary tracking-widest bg-gray-50/50 border-b border-border">
                      <th className="px-8 py-4">Conductor</th>
                      <th className="px-8 py-4 text-center">Entregas</th>
                      <th className="px-8 py-4">Efectividad</th>
                      <th className="px-8 py-4">Insignia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-400">Procesando ranking...</td></tr>
                    ) : ranking.length === 0 ? (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-400">No hay repartidores en el sistema.</td></tr>
                    ) : ranking.map((driver, index) => (
                      <tr key={index} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-xs text-text-secondary border border-border group-hover:bg-primary group-hover:text-white transition-all">
                              {driver.driverName[0]}
                            </div>
                            <span className="font-bold text-sm">{driver.driverName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-sm text-text-secondary">{driver.successfulDeliveries}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${driver.effectivenessPercentage}%` }}
                                className={`h-full rounded-full ${driver.effectivenessPercentage >= 80 ? 'bg-primary' :
                                  driver.effectivenessPercentage >= 50 ? 'bg-warning' : 'bg-danger'
                                  }`}
                              />
                            </div>
                            <span className="text-[11px] font-black text-text-primary w-10">{driver.effectivenessPercentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-lg bg-gray-50 p-2 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-border">{driver.tag}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Insights / Activity */}
            <div className="bg-primary-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 backdrop-blur-3xl" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Análisis Nacional</h3>
                </div>

                <p className="text-white/60 text-sm font-medium leading-relaxed mb-8">
                  La ruta nacional ha incrementado su efectividad en un <span className="text-primary font-black">+14%</span> respecto al mes anterior.
                </p>

                <div className="space-y-6 flex-1">
                  {[
                    { city: 'Medellín', pct: 88, color: 'bg-primary' },
                    { city: 'Cali', pct: 72, color: 'bg-warning' },
                    { city: 'Barranquilla', pct: 94, color: 'bg-primary' },
                    { city: 'Pereira', pct: 12, color: 'bg-danger' }
                  ].map((loc, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                        <span>{loc.city}</span>
                        <span className="text-white/80">{loc.pct}% Capacidad</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${loc.color}`} style={{ width: `${loc.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-10 py-4 bg-primary text-primary-dark font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white transition-all shadow-xl shadow-primary/20">
                  Reporte de Operación PDF
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
