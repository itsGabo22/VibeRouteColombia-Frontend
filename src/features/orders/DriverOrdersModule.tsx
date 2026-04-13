import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, Package, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/lib/api';
import { Modal } from '../../../shared/components/Modal';

interface Order {
  id: number;
  uuid: string;
  address: string;
  city: string;
  status: 'PENDING' | 'ON_ROUTE' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  clientReference: string;
  nonDeliveryReason?: string;
}

export const DriverOrdersModule: React.FC<{ driverName: string }> = ({ driverName }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchDriverOrders = async () => {
      try {
        const { data: batches } = await api.get('/batches');
        // Filtramos el lote activo del conductor actual
        const activeBatch = batches.find((b: any) => 
          b.driver && b.driver.name.toLowerCase() === driverName.toLowerCase() && b.status !== 'COMPLETED'
        );
        
        if (activeBatch && activeBatch.orders) {
          setOrders(activeBatch.orders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDriverOrders();
  }, [driverName]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.clientReference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ON_ROUTE': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch(priority) {
      case 'HIGH': return 'text-red-500 bg-red-50';
      case 'MEDIUM': return 'text-amber-500 bg-amber-50';
      default: return 'text-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por referencia o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-slate-300 font-medium text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['ALL', 'PENDING', 'ON_ROUTE', 'DELIVERED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                filterStatus === s 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-8 py-5">Referencia</th>
                <th className="px-8 py-5">Destino</th>
                <th className="px-8 py-5">Prioridad</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium">Sincronizando pedidos...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium">No se encontraron pedidos.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">
                        #{order.id}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{order.clientReference || 'Sin REF'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{order.address}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{order.city}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPriorityStyle(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                      {order.status === 'DELIVERED' && <CheckCircle2 size={12} />}
                      {order.status === 'CANCELLED' && <XCircle size={12} />}
                      {order.status === 'PENDING' && <Clock size={12} />}
                      {order.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all overflow-hidden"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (Ficha de Pedido) */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title="Ficha Técnica de Pedido"
      >
        {selectedOrder && (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">IDENTIFICADOR OPERATIVO</span>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter italic">REF: {selectedOrder.clientReference}</h4>
              </div>
              <div className={`px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-widest ${getStatusStyle(selectedOrder.status)}`}>
                {selectedOrder.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={14} className="text-green-500" /> Dirección de Entrega
                </div>
                <p className="text-slate-900 font-bold leading-tight">{selectedOrder.address}</p>
                <p className="text-xs text-slate-500">{selectedOrder.city}, CO</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Package size={14} className="text-green-500" /> Prioridad de Carga
                </div>
                <p className={`text-sm font-black uppercase tracking-widest ${getPriorityStyle(selectedOrder.priority)}`}>
                  Nivel {selectedOrder.priority}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Impacto en ruta: Alto</p>
              </div>
            </div>

            {selectedOrder.status === 'CANCELLED' && (
              <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex gap-4 items-start">
                <AlertCircle className="text-red-500 shrink-0" size={24} />
                <div className="space-y-1">
                  <h5 className="text-sm font-black text-red-900 uppercase tracking-widest">Motivo de no entrega</h5>
                  <p className="text-red-700 text-sm font-medium italic">"{selectedOrder.nonDeliveryReason || 'Sin motivo reportado'}"</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <Info size={14} /> Historial del Pedido
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                <div className="relative before:absolute before:-left-[21px] before:top-1.5 before:w-2.5 before:h-2.5 before:bg-green-500 before:rounded-full before:border-2 before:border-white">
                  <p className="text-xs font-bold text-slate-700">Pedido Recibido</p>
                  <p className="text-[10px] text-slate-400">Hoy • 08:30 AM</p>
                </div>
                <div className="relative before:absolute before:-left-[21px] before:top-1.5 before:w-2.5 before:h-2.5 before:bg-slate-300 before:rounded-full before:border-2 before:border-white">
                  <p className="text-xs font-bold text-slate-400 italic">Estado Actual: {selectedOrder.status}</p>
                </div>
              </div>
            </div>

            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl shadow-slate-200 hover:bg-green-600 transition-all uppercase text-[10px] tracking-widest">
              Imprimir Guía de Transporte
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
