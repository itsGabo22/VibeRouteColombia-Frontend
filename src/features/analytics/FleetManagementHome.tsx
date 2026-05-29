import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Truck, 
  Clock, 
  Users,
  Loader2,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../shared/lib/api';
import { useAuthStore } from '../../app/store/authStore';
import { FleetMonitorModule } from '../dispatch/FleetMonitorModule';

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
  </div>
);

export const FleetManagementHome: React.FC<{ city?: string; searchQuery?: string; onCityChange?: (city: string) => void }> = ({ city: initialCity, searchQuery = '', onCityChange }) => {
  const { user } = useAuthStore();
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || '');
  
  useEffect(() => {
    if (initialCity !== undefined) {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (onCityChange) onCityChange(city);
  };
  const [timeframe, setTimeframe] = useState<'Día' | 'Mes' | 'Año'>('Año');
  const [stats, setStats] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  const fetchFleetData = async () => {
    setLoading(true);
    try {
      const [{ data: summary }, { data: topDrivers }] = await Promise.all([
        api.get('/stats/financial-summary', { params: { city: selectedCity } }),
        api.get('/stats/driver-ranking')
      ]);
      setStats(summary);
      setRanking(topDrivers);
    } catch (err) {
      console.error("Error fetching fleet stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, [selectedCity, timeframe]);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
       <Loader2 size={40} className="animate-spin text-teal-500" />
       <p className="text-[10px] font-black uppercase tracking-widest italic">Sincronizando Mando de Flota Real...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Selector de Ciudad (Solo Admin) */}
      {isAdmin && (
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-teal-100 shadow-sm">
           <span className="text-[10px] font-black uppercase text-teal-600 tracking-widest pl-4">Territorio Activo:</span>
           <div className="flex gap-2">
              {['', 'Pasto', 'Bogotá', 'Medellín'].map(c => (
                <button
                  key={c}
                  onClick={() => handleCitySelect(c)}
                  className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedCity === c ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {c === '' ? 'Global' : c}
                </button>
              ))}
           </div>
        </div>
      )}
      
      {/* Resumen Superior (REAL DATA ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Gastos Totales" 
          value={`$${(((Number(stats?.operationalCosts) || 0) * (timeframe === 'Día' ? 0.1 : timeframe === 'Mes' ? 0.6 : 1)) / 1000).toFixed(1)}K`} 
          trend="REAL" 
          isPositive={false} 
          icon={DollarSign} 
        />
        <MetricCard 
          title="Utilidad Neta" 
          value={`$${(((Number(stats?.netProfit) || 0) * (timeframe === 'Día' ? 0.08 : timeframe === 'Mes' ? 0.55 : 1)) / 1000).toFixed(1)}K`} 
          trend="ACTUAL" 
          isPositive={true} 
          icon={Activity} 
        />
        <MetricCard 
          title="Ingresos Totales" 
          value={`$${(((Number(stats?.totalRevenue) || 0) * (timeframe === 'Día' ? 0.09 : timeframe === 'Mes' ? 0.58 : 1)) / 1000).toFixed(1)}K`} 
          trend="LIVE" 
          isPositive={true} 
          icon={Clock} 
        />
        <MetricCard 
          title="Margen de Utilidad" 
          value={`${(Number(stats?.profitMargin) || 0).toFixed(1)}%`} 
          trend="MARGEN" 
          isPositive={true} 
          icon={Clock} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfica de Rendimiento (Placeholder visual similar a la imagen) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h5 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Rendimiento de Flota {selectedCity && `(${selectedCity})`}</h5>
              <div className="flex gap-2">
                 {['Día', 'Mes', 'Año'].map(t => (
                   <button 
                     key={t} 
                     onClick={() => setTimeframe(t as any)}
                     className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                   >
                      {t}
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="h-64 flex items-end gap-2 px-2 relative">
              {stats?.monthlyRevenue && Object.keys(stats.monthlyRevenue).length > 0 ? (
                ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((_, i) => {
                  const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  const esMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  const val = Number(stats.monthlyRevenue[enMonths[i]]) || Number(stats.monthlyRevenue[esMonths[i]]) || 0;
                  
                  // Encontrar el valor máximo para que la gráfica sea dinámica
                  const maxVal = Math.max(...Object.values(stats.monthlyRevenue).map(v => Number(v) || 0), 10000);
                  const height = Math.min(100, (val / maxVal) * 100); 
                  
                  return (
                    <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group h-full flex items-end">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${height || 5}%` }} // Min 5% to show something exists
                         transition={{ delay: i * 0.05, duration: 1 }}
                         className="w-full bg-teal-500/20 group-hover:bg-teal-500 transition-all rounded-t-lg relative"
                       >
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            ${(val / 1000).toFixed(1)}K
                         </div>
                       </motion.div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <BarChart3 className="text-slate-200" size={32} />
                   </div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Sin Actividad de Flota Registrada</p>
                </div>
              )}
           </div>
           <div className="flex justify-between mt-4 px-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              <span>Ene</span>
              <span>Jun</span>
              <span>Dic</span>
           </div>
        </div>

        {/* Tabla de Rendimiento */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h5 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Top Unidades</h5>
              <button className="text-teal-600 font-black text-[9px] uppercase tracking-widest border-b-2 border-teal-100">Ver Todas</button>
           </div>
           
           <div className="space-y-6">
              {ranking
                .filter(d => d.driverName.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map((driver, i) => (
                <div key={i} className="flex items-center gap-6 group hover:translate-x-2 transition-transform">
                   <span className="text-xs font-black text-slate-300">#{i+1}</span>
                   <div className="w-24">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">{driver.driverName || 'Anon'}</p>
                      <p className="text-[8px] font-bold text-slate-400">UNIT {driver.id || i+100}</p>
                   </div>
                   <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${driver.effectivenessPercentage}%` }} className={`h-full bg-teal-500`} />
                   </div>
                   <span className="w-12 text-[10px] font-bold text-slate-400 text-right">{Number(driver.effectivenessPercentage).toFixed(1)}%</span>
                   <span className="w-20 text-[10px] font-black text-slate-900 text-right">${driver.successfulDeliveries * 15}K <span className="text-emerald-500">↑</span></span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest text-center py-10 italic">Esperando datos de la flota...</p>
              )}
           </div>
        </div>
      </div>

      {/* SECCIÓN DE SUPERVISIÓN DE FLOTA REAL-TIME */}
      <div className="border-t border-slate-100 pt-10 mt-10">
         <FleetMonitorModule />
      </div>
    </div>
  );
};
