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
  LayoutDashboard,
  Loader2,
  DollarSign,
  CheckCircle2,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import { useMissionStore } from '../../app/store/missionStore';
import { GeminiInsightModule } from '../../features/ai/GeminiInsightModule';
import { DriverCopilotBanner } from '../../features/ai/DriverCopilotBanner';
import api from '../../shared/lib/api';
import { OrdersManagementModule } from '../../features/orders/OrdersManagementModule';
import { MapsNavigationModule } from '../../features/routes/MapsNavigationModule';

export const DriverDashboardPage: React.FC = () => {
  const { user, logout, token } = useAuthStore();
  const { currentBatchId, startMission } = useMissionStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'summary' | 'list' | 'map'>('summary');

  const [driverId, setDriverId] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ delivered: 0, pending: 0, cancelled: 0, returned: 0, hours: 0, totalValue: 0 });
  const [nextOrder, setNextOrder] = useState<any>(null);
  const [copilotTips, setCopilotTips] = useState<string>('');

  const fetchData = async () => {
    try {
      const { data: batches } = await api.get('/batches');
      const myBatch = batches.find((b: any) =>
        b.driver && b.driver.email === user?.email && b.status !== 'COMPLETED'
      );

      if (myBatch) {
        if (myBatch.driver?.id) setDriverId(myBatch.driver.id);
        startMission(myBatch.id);
        if (myBatch.aiCopilotTips) setCopilotTips(myBatch.aiCopilotTips);

        if (myBatch.orders) {
          const allOrders = myBatch.orders;
          setOrders(allOrders);
          const delivered = allOrders.filter((o: any) => o.status === 'DELIVERED').length;
          const pending = allOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'ON_ROUTE').length;
          const cancelled = allOrders.filter((o: any) => o.status === 'CANCELLED').length;
          const returned = allOrders.filter((o: any) => o.status === 'RETURNED').length;
          const totalValue = allOrders.reduce((sum: number, o: any) => sum + (o.price || 0), 0);

          const timestamps = allOrders
            .map((o: any) => o.actualDeliveryTime)
            .filter(Boolean)
            .map((t: string) => new Date(t).getTime());

          let hours = 0.5;
          if (timestamps.length > 0) {
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            if (maxTime > minTime) {
              hours = Number(((maxTime - minTime) / (1000 * 60 * 60)).toFixed(1));
            }
          }
          if (hours < 0.1) hours = 0.5;

          setStats({ delivered, pending, cancelled, returned, hours, totalValue });
          const next = allOrders.find((o: any) => o.status === 'PENDING' || o.status === 'ON_ROUTE');
          setNextOrder(next);
        }
      } else {
        setDriverId(1); // Modo test
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
  }, [token, user?.email]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-10 z-50">
        <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando Hoja de Ruta...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#F8FAFC] flex flex-col overflow-hidden font-sans relative">

      {/* Header - Hidden in Map View to maximize space */}
      {view !== 'map' && (
        <header className="bg-white border-b border-slate-100 px-6 py-5 shrink-0 z-30 shadow-sm">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 text-white">
                <Truck size={20} />
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">
                PANEL DEL <br />
                <span className="text-green-500">CONDUCTOR</span>
              </h1>
            </div>
            <button onClick={handleLogout} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full relative ${view === 'map' ? 'h-full' : 'overflow-y-auto pb-32'}`}>
        <div className={view === 'map' ? 'h-full w-full' : 'max-w-md mx-auto p-6 space-y-8'}>

          {/* User Welcome - Only in Summary View */}
          {view === 'summary' && (
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-lg">
                {user?.name?.[0]}{user?.name?.split(' ')?.[1]?.[0]}
              </div>
              <div>
                <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em] mb-0.5">Operación en curso</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Hola, {user?.name?.split(' ')[0]}</h2>
              </div>
            </div>
          )}

          {/* AI Copilot Banner — shows progressive tips based on delivery stats */}
          {view === 'summary' && copilotTips && (
            <DriverCopilotBanner
              tipsJson={copilotTips}
              stats={{ delivered: stats.delivered, pending: stats.pending, total: orders.length }}
              driverName={user?.name?.split(' ')[0]}
            />
          )}

          <AnimatePresence mode="wait">
            {view === 'summary' ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valor de Ruta</p>
                      <DollarSign size={16} className="text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">${stats.totalValue.toLocaleString()}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Entregados</p>
                    <h3 className="text-2xl font-black text-green-600">{stats.delivered}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Pendientes</p>
                    <h3 className="text-2xl font-black text-amber-500">{stats.pending}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Cancelados</p>
                    <h3 className="text-2xl font-black text-rose-500">{stats.cancelled}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Devueltos</p>
                    <h3 className="text-2xl font-black text-orange-500">{stats.returned}</h3>
                  </div>
                </div>

                {nextOrder ? (
                  <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                        Próximo Destino
                      </div>
                      <h4 className="text-2xl font-black tracking-tighter leading-tight">{nextOrder.address}</h4>
                      <p className="text-slate-400 text-sm">{nextOrder.city}, CO</p>
                      <button
                        onClick={() => setView('map')}
                        className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 mt-4 active:scale-95 transition-all"
                      >
                        Iniciar Navegación <Navigation size={16} className="text-green-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2.5rem] text-center border border-green-100 shadow-xl shadow-green-100/50">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">¡Todo al día!</h3>
                    <p className="text-slate-400 text-sm mb-8">Has completado tus entregas.</p>
                    <GeminiInsightModule stats={{ delivered: stats.delivered, pending: 0, cancelled: stats.cancelled, returned: stats.returned, hours: stats.hours, city: 'Pasto' }} />
                  </div>
                )}
              </motion.div>
            ) : view === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <OrdersManagementModule driverName={user?.name || ''} onUpdate={fetchData} />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full absolute inset-0 z-0"
              >
                <MapsNavigationModule />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation Footer - Always visible and on top */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100 p-3 shrink-0 z-40 fixed bottom-0 left-0 right-0">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <button
            onClick={() => setView('summary')}
            className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view === 'summary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Turno</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Package size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <button
            onClick={() => setView('map')}
            className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view === 'map' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <MapIcon size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Mapa</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
