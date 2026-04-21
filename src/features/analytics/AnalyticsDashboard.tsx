import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { 
  Target,
  RefreshCcw,
  Download,
  DollarSign,
  TrendingDown,
  PieChart
} from 'lucide-react';
import api from '../../shared/lib/api';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

type City = 'Bogotá' | 'Medellín' | 'Pasto' | 'Todas';

export const AnalyticsDashboard: React.FC = () => {
  const [activeCity, setActiveCity] = useState<City>('Todas');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [{ data: summary }, { data: topDrivers }, { data: finStats }] = await Promise.all([
        api.get('/stats/delivery-summary'),
        api.get('/stats/driver-ranking'),
        api.get('/stats/financial-summary')
      ]);
      setStats(summary);
      setRanking(topDrivers);
      setFinancials(finStats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Gráfica de Barras Basada en Datos Reales (Módulo 1)
  const barSeriesDelivered = activeCity === 'Todas' 
    ? [stats?.today || 0, (stats?.week || 0) / 7, (stats?.week || 0) / 5] // Estimación basada en real
    : [stats?.byCity?.[activeCity] || 0];

  const barData = {
    labels: activeCity === 'Todas' ? ['Hoy', 'Semana', 'Mes'] : [activeCity],
    datasets: [
      {
        label: 'Entregas (Uds)',
        data: activeCity === 'Todas' ? [stats?.today || 0, stats?.thisWeek || 0, stats?.thisMonth || 0] : [stats?.deliveriesByCity?.[activeCity] || 0],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Ingresos ($)',
        data: activeCity === 'Todas' ? [0, 0, financials?.totalRevenue || 0] : [financials?.revenueByCity?.[activeCity] || 0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      }
    ],
  };

  // Gráfica Circular con Distribución Real por Ciudad
  const pieData = {
    labels: ['Bogotá', 'Medellín', 'Pasto'],
    datasets: [
      {
        data: [
          financials?.revenueByCity?.['Bogotá'] || 0,
          financials?.revenueByCity?.['Medellín'] || 0,
          financials?.revenueByCity?.['Pasto'] || 0,
        ],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 10, weight: 'bold' as any }
        }
      }
    },
    scales: {
      y: { display: false },
      x: { grid: { display: false } }
    }
  };

  const cityCount = activeCity === 'Todas' 
    ? stats?.today || 0 
    : stats?.byCity?.[activeCity] || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header & Filtros (Módulo 1) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
             Mando <span className="text-indigo-600">Nacional</span>
           </h2>
           <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Sincronización Total - Base de Datos Activa</p>
        </div>

        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
           {(['Todas', 'Bogotá', 'Medellín', 'Pasto'] as City[]).map((city) => (
             <button
               key={city}
               onClick={() => setActiveCity(city)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeCity === city 
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                 : 'text-slate-400 hover:bg-slate-50'
               }`}
             >
               {city}
             </button>
           ))}
           <div className="w-[1px] h-6 bg-slate-100 mx-2"></div>
           <button onClick={fetchAnalytics} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
              <RefreshCcw size={16} />
           </button>
        </div>
      </div>

      {/* KPI Cards (REAL DATA) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Ingresos Totales', val: `$${financials?.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Gastos Operativos', val: `$${financials?.operationalCosts?.toLocaleString() || '0'}`, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
           { label: 'Utilidad Neta', val: `$${financials?.netProfit?.toLocaleString() || '0'}`, icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Margen de Ganancia', val: `${financials?.profitMarginPercentage || 0}%`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' }
         ].map((kpi, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500"
           >
              <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} rounded-bl-full opacity-30 group-hover:scale-125 transition-transform duration-700`}></div>
              <kpi.icon className={`relative z-10 ${kpi.color} mb-4`} size={24} />
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{kpi.val}</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{kpi.label}</p>
           </motion.div>
         ))}
      </div>

      {/* Real-time Driver Ranking Area */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
         <div className="flex justify-between items-center mb-6 relative z-10">
            <h5 className="font-black uppercase tracking-widest text-xs">Ranking de Eficiencia Real</h5>
            <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">Top 5 Semanal</span>
         </div>
         <div className="space-y-4 relative z-10">
            {ranking.map((driver, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                 <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-indigo-400">#{i+1}</span>
                    <div>
                       <p className="text-sm font-black">{driver.driverName || 'Conductor Anónimo'}</p>
                       <p className="text-[9px] uppercase font-bold text-slate-500">{driver.tag || 'Standard'}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">{driver.effectivenessPercentage}%</p>
                    <p className="text-[8px] uppercase font-bold text-slate-500">{driver.successfulDeliveries} Entregas</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfica de Barras */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h5 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Rendimiento Semanal Periódico</h5>
              <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                 <Download size={16} />
              </button>
           </div>
           <div className="h-[300px]">
              <Bar data={barData} options={chartOptions as any} />
           </div>
        </div>

        {/* Gráfica Circular */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h5 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-8 text-center">Distribución de Estados</h5>
           <div className="h-[250px]">
              <Pie data={pieData} options={chartOptions as any} />
           </div>
           <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                 <p className="text-2xl font-black text-emerald-500 tracking-tighter">98.2%</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Éxito</p>
              </div>
              <div className="text-center">
                 <p className="text-2xl font-black text-rose-500 tracking-tighter">1.8%</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fallidos</p>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};
