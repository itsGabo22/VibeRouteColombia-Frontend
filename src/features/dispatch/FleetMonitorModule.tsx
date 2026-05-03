import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Users, Package, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  ChevronRight, User as UserIcon, BarChart3, MapPin, Phone, Mail, 
  Activity, Zap, Clock
} from 'lucide-react';
import api from '../../shared/lib/api';

interface DriverStatus {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  assignedCity: string;
  completedOrders: number;
  failedOrders: number;
  currentBatchId: number | null;
  currentOrdersCount: number | null;
  activeAddresses: string[];
}

export const FleetMonitorModule: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/drivers/fleet-status');
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching fleet status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-teal-500';
      case 'ON_ROUTE': return 'bg-indigo-500';
      case 'INACTIVE': return 'bg-slate-400';
      case 'BUSY': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'ON_ROUTE': return 'En Ruta';
      case 'INACTIVE': return 'Desconectado';
      case 'BUSY': return 'Ocupado';
      default: return status;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-teal-50 border-teal-100';
      case 'ON_ROUTE': return 'bg-indigo-50 border-indigo-100';
      case 'INACTIVE': return 'bg-slate-50 border-slate-100';
      case 'BUSY': return 'bg-amber-50 border-amber-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const getEfficiency = (driver: DriverStatus) => {
    const total = (driver.completedOrders || 0) + (driver.failedOrders || 0);
    if (total === 0) return null;
    return Math.round(((driver.completedOrders || 0) / total) * 100);
  };

  // Stats resumen
  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'AVAILABLE').length;
  const onRouteCount = drivers.filter(d => d.status === 'ON_ROUTE').length;
  const inactiveCount = drivers.filter(d => d.status === 'INACTIVE').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Users size={22} />
            </div>
            MONITOR DE FLOTA <span className="text-indigo-500 italic">REAL-TIME</span>
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 ml-[52px]">
            Supervisión de repartidores y estados de entrega
          </p>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={refreshing}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar Ahora'}
        </button>
      </div>

      {/* KPIs Rápidos */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                <Users size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Flota</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{totalDrivers}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <Zap size={16} />
              </div>
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Disponibles</span>
            </div>
            <p className="text-3xl font-black text-teal-600 tracking-tight">{availableCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Truck size={16} />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">En Ruta</span>
            </div>
            <p className="text-3xl font-black text-indigo-600 tracking-tight">{onRouteCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Clock size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin Conexión</span>
            </div>
            <p className="text-3xl font-black text-slate-400 tracking-tight">{inactiveCount}</p>
          </div>
        </div>
      )}

      {/* Driver Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Users size={32} />
          </div>
          <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest">
            No hay repartidores registrados en el sistema
          </p>
          <p className="text-slate-300 text-[10px] font-medium mt-2">
            Registra conductores desde "Gestión de Personal" para verlos aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {drivers.map((driver, index) => {
              const efficiency = getEfficiency(driver);
              return (
                <motion.div
                  key={driver.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow"
                >
                  {/* Driver Header */}
                  <div className="p-6 pb-4 flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=${driver.status === 'ON_ROUTE' ? '6366f1' : driver.status === 'AVAILABLE' ? '14b8a6' : '94a3b8'}&color=fff&bold=true`} 
                            alt={driver.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Status Indicator Dot */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(driver.status)} rounded-full border-[3px] border-white`} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 tracking-tight text-lg leading-tight">{driver.name}</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <MapPin size={10} className="text-teal-400" />
                          {driver.assignedCity || 'Ciudad no asignada'}
                        </p>
                        <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border ${getStatusBg(driver.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(driver.status)} animate-pulse`} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">{getStatusLabel(driver.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {(driver.phone || driver.email) && (
                    <div className="px-6 pb-3 flex gap-4">
                      {driver.phone && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                          <Phone size={10} className="text-slate-300" />
                          {driver.phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance Stats */}
                  <div className="px-6 py-4 bg-slate-50/50 grid grid-cols-3 gap-3 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                        <CheckCircle size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Exitosos</p>
                        <p className="text-sm font-black text-slate-800 leading-none">{driver.completedOrders || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                        <XCircle size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Fallidos</p>
                        <p className="text-sm font-black text-slate-800 leading-none">{driver.failedOrders || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        efficiency !== null 
                          ? efficiency >= 90 ? 'bg-emerald-50 text-emerald-600' 
                            : efficiency >= 70 ? 'bg-amber-50 text-amber-600' 
                            : 'bg-rose-50 text-rose-600'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        <Activity size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Eficiencia</p>
                        <p className={`text-sm font-black leading-none ${
                          efficiency !== null
                            ? efficiency >= 90 ? 'text-emerald-600' 
                              : efficiency >= 70 ? 'text-amber-600' 
                              : 'text-rose-600'
                            : 'text-slate-400'
                        }`}>
                          {efficiency !== null ? `${efficiency}%` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Load */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    {driver.currentBatchId ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                            <Truck size={12} className="animate-pulse" />
                            Carga Actual Activa
                          </h5>
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black border border-indigo-100">
                            BATCH #{driver.currentBatchId}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="text-slate-400" size={16} />
                            <span className="text-[12px] font-bold text-slate-700">{driver.currentOrdersCount} pedidos asignados</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            {driver.activeAddresses && driver.activeAddresses.map((addr, idx) => (
                              <p key={idx} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                <ChevronRight size={10} className="text-indigo-300" /> {addr}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                          {driver.status === 'AVAILABLE' ? <Zap size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                          {driver.status === 'AVAILABLE' ? (
                            <>Listo para asignar<br/><span className="text-[9px] normal-case font-medium text-teal-500">Esperando nuevas zonas de despacho</span></>
                          ) : (
                            <>Sin pedidos asignados<br/><span className="text-[9px] normal-case font-medium">El conductor necesita conectarse</span></>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Completion Stats Summary */}
                    {(driver.completedOrders || 0) > 0 && driver.status === 'AVAILABLE' && !driver.currentBatchId && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 flex items-center gap-3">
                        <BarChart3 className="text-teal-600" size={18} />
                        <p className="text-[10px] font-bold text-teal-800 leading-tight">
                          ¡Jornada Productiva! <br/>
                          <span className="font-normal text-teal-600">
                            {driver.completedOrders} entregas completadas
                            {efficiency !== null && ` • ${efficiency}% efectividad`}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
