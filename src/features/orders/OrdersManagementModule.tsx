import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Phone, User, Package, Clock, 
  CheckCircle2, XCircle, ChevronRight, Navigation, Loader2,
  Calendar, Info, AlertTriangle, TrendingUp, X, Trash2, FileText, ChevronLeft, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { DestructiveActionModal } from '../../ui/components/DestructiveActionModal';

interface Order {
  id: number;
  clientReference: string;
  clientName: string;
  address: string;
  city: string;
  status: 'PENDING' | 'ON_ROUTE' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt?: string;
  nonDeliveryReason?: string;
  driverName?: string;
}

export const OrdersManagementModule: React.FC<{ 
  driverName: string;
  forceCity?: string;
  searchQuery?: string;
  onUpdate?: () => void;
}> = ({ driverName, forceCity, searchQuery = '', onUpdate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Novedad states
  const [isNovedadOpen, setIsNovedadOpen] = useState(false);
  const [novedadReason, setNovedadReason] = useState('');
  const [novedadStatus, setNovedadStatus] = useState<'CANCELLED' | 'RETURNED'>('CANCELLED');

  useEffect(() => {
    fetchOrders();
    if (searchQuery) setSearchTerm(searchQuery);
  }, [driverName, forceCity, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: batches } = await api.get('/batches');
      
      let allOrders: Order[] = [];

      if (driverName) {
        const myBatch = batches.find((b: any) => 
          b.driver && b.driver.name?.toLowerCase() === driverName?.toLowerCase() && b.status !== 'COMPLETED'
        );
        allOrders = myBatch?.orders?.map((o: any) => ({ ...o, driverName: myBatch.driver.name })) || [];
      } else {
        batches.forEach((b: any) => {
          if (b.orders) {
             const mapped = b.orders.map((o: any) => ({ ...o, driverName: b.driver?.name || 'Sin Asignar' }));
             allOrders.push(...mapped);
          }
        });
      }
      
      if (forceCity) {
        allOrders = allOrders.filter(o => o.city?.toLowerCase() === forceCity.toLowerCase());
      }

      setOrders(allOrders);
      
      if (!driverName) {
         const drivers = Array.from(new Set(allOrders.map(o => o.driverName))).filter(Boolean) as string[];
         setAvailableDrivers(drivers.sort());
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: string, reason?: string) => {
    if (!orderId && orderId !== 0) {
      console.error("Cannot update order: orderId is undefined/null", { orderId, nextStatus });
      alert("Error: No se pudo identificar el pedido. Intenta recargar la página.");
      return;
    }
    try {
      setIsUpdating(true);
      const url = reason 
        ? `/orders/${orderId}/status?status=${nextStatus}&reason=${encodeURIComponent(reason)}`
        : `/orders/${orderId}/status?status=${nextStatus}`;
        
      await api.patch(url);
      
      setOrders((prev: Order[]) => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any, nonDeliveryReason: reason } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: Order | null) => prev ? { ...prev, status: nextStatus as any, nonDeliveryReason: reason } : null);
      }
      setIsNovedadOpen(false);
      setNovedadReason('');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error("Error updating order:", err);
      const serverMessage = err.response?.data?.error || err.response?.data?.message || "Servidor no disponible";
      alert("Error al actualizar: " + serverMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      setIsUpdating(true);
      await api.delete(`/orders/${orderId}`);
      setOrders((prev: Order[]) => prev.filter(o => o.id !== orderId));
      setSelectedIds(prev => prev.filter(id => id !== orderId));
      setSelectedOrder(null);
      setShowDeleteModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error al eliminar pedido:", err);
      alert("No se pudo eliminar el pedido. Podría estar asignado a un proceso crítico.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${selectedIds.length} pedidos?`)) return;
    
    try {
      setIsUpdating(true);
      for (const id of selectedIds) {
        await api.delete(`/orders/${id}`);
      }
      setOrders(prev => prev.filter(o => !selectedIds.includes(o.id)));
      setSelectedIds([]);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error en eliminación masiva:", err);
      alert("Algunos pedidos no pudieron ser eliminados.");
      fetchOrders();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadRegionalReport = async () => {
    // Si forceCity existe, lo usamos. Si no, preguntamos si quiere el global.
    const activeCity = forceCity || '';
    if (!activeCity && !window.confirm("¿Deseas generar el reporte de todas las zonas?")) return;
    
    try {
      setIsDownloading(true);
      // Evitamos el cache del navegador añadiendo un timestamp y limpiando el nombre
      const cleanCity = (activeCity || '').trim();
      const cityQuery = cleanCity ? `city=${encodeURIComponent(cleanCity)}` : '';
      const url = `/reports/generate-excel?t=${new Date().getTime()}${cityQuery ? '&' + cityQuery : ''}`;
      
      const response = await api.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Aseguramos que el nombre del archivo refleje la ciudad REAL
      const fileName = cleanCity ? `Lista_Pedidos_${cleanCity}.xlsx` : 'Reporte_Pedidos.xlsx';
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading regional report:", err);
      alert("No se pudo generar el reporte regional en Excel.");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const statusMap: any = {
    'PENDING': { label: 'PENDIENTE', color: 'bg-slate-100 text-slate-600', icon: Clock },
    'ON_ROUTE': { label: 'EN RUTA', color: 'bg-blue-50 text-blue-600', icon: Navigation },
    'DELIVERED': { label: 'ENTREGADO', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
    'CANCELLED': { label: 'CANCELADO', color: 'bg-red-50 text-red-600', icon: XCircle },
    'RETURNED': { label: 'DEVUELTO', color: 'bg-amber-50 text-amber-600', icon: AlertTriangle },
  };

  const priorityMap: any = {
    'HIGH': { label: 'ALTA', color: 'bg-red-50 text-red-500' },
    'MEDIUM': { label: 'MEDIA', color: 'bg-amber-50 text-amber-500' },
    'LOW': { label: 'BAJA', color: 'bg-blue-50 text-blue-500' },
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.clientReference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || order.status === filterStatus;
    const matchesDriver = driverFilter === 'ALL' || order.driverName === driverFilter;
    
    return matchesSearch && matchesFilter && matchesDriver;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex w-full xl:w-auto gap-4 flex-col md:flex-row">
           <div className="relative w-full md:w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
             <input 
               type="text"
               placeholder="Buscar referencia o cliente..."
               className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500/20 transition-all shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           {!driverName && availableDrivers.length > 0 && (
             <div className="relative w-full md:w-64">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500/20 appearance-none shadow-sm cursor-pointer"
                >
                   <option value="ALL">Todos los repartidores</option>
                   {availableDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
           )}
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide items-center">
          {/* Regional Report Button */}
          {!driverName && (
            <button 
               onClick={handleDownloadRegionalReport}
               disabled={isDownloading}
               className="px-8 py-4 bg-emerald-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200/50 flex items-center gap-3 disabled:opacity-50"
            >
               {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
               Exportar Excel Regional
            </button>
          )}

          {/* Bulk Delete Button */}
          {!driverName && selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100 animate-in fade-in zoom-in duration-300"
            >
              <Trash2 size={14} />
              Borrar {selectedIds.length}
            </button>
          )}

          <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block" />

          {['ALL', 'PENDING', 'ON_ROUTE', 'DELIVERED'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === s 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-50'
              }`}
            >
              {s === 'ALL' ? 'TODOS' : statusMap[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {!driverName && (
                  <th className="pl-8 py-6 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino Operativo</th>
                {!driverName && (
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</th>
                )}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prioridad</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={driverName ? 5 : 7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando operaciones...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={driverName ? 5 : 7} className="p-32 text-center">
                  <Package className="mx-auto text-slate-200 mb-2" size={48} />
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Sin registros encontrados</p>
                </td></tr>
              ) : (
                filteredOrders
                  .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                  .map((order) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={order.id} 
                    className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {!driverName && (
                      <td className="pl-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          checked={selectedIds.includes(order.id)}
                          onChange={(e) => toggleSelectOrder(e as any, order.id)}
                        />
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm shadow-green-100 group-hover:scale-110 transition-transform">
                            #{order.id}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 tracking-tighter text-sm italic">{order.clientReference}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recibido: 08:30 AM</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-slate-300 mt-1" />
                          <div>
                             <p className="text-sm font-black text-slate-700 tracking-tight">{order.address}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.city}</p>
                          </div>
                       </div>
                    </td>
                    {!driverName && (
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <User size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{order.driverName}</span>
                         </div>
                      </td>
                    )}
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityMap[order.priority]?.color || 'bg-slate-100 text-slate-400'}`}>
                           {priorityMap[order.priority]?.label || order.priority}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                         <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${statusMap[order.status]?.color || 'bg-slate-50 text-slate-400'}`}>
                           {React.createElement(statusMap[order.status]?.icon || Info, { size: 10 })}
                           {statusMap[order.status]?.label || order.status}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight size={16} />
                       </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredOrders.length > ordersPerPage && (
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando {Math.min(filteredOrders.length, currentPage * ordersPerPage)} de {filteredOrders.length}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-600">
                {currentPage} / {Math.ceil(filteredOrders.length / ordersPerPage)}
              </div>
              <button
                disabled={currentPage >= Math.ceil(filteredOrders.length / ordersPerPage)}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedOrder(null); setIsNovedadOpen(false); }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              {/* Close Button — Always visible, sticky */}
              <button 
                onClick={() => { setSelectedOrder(null); setIsNovedadOpen(false); }}
                className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-90"
              >
                <X size={18} />
              </button>

              {/* Scrollable Content */}
              <div className="p-8 sm:p-10 space-y-6 overflow-y-auto flex-1">
                {/* Header */}
                <div className="pr-10 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                      <Package size={10} /> Pedido
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusMap[selectedOrder.status]?.color || 'bg-slate-100 text-slate-400'}`}>
                      {React.createElement(statusMap[selectedOrder.status]?.icon || Info, { size: 10 })}
                      {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                    {selectedOrder.priority && (
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityMap[selectedOrder.priority]?.color || 'bg-slate-100 text-slate-400'}`}>
                        {priorityMap[selectedOrder.priority]?.label || selectedOrder.priority}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                    #{selectedOrder.id} <span className="text-slate-400">•</span> {selectedOrder.clientReference}
                  </h2>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Cliente</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User size={14} className="text-slate-300" /> {selectedOrder.clientName || 'Sin nombre'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Destino</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={14} className="text-slate-300" /> {selectedOrder.address}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedOrder.city}, Colombia</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Trazabilidad</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-lg shadow-green-100 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Recibido en Centro Logístico</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-[3px] border-white shadow-lg shrink-0 ${
                      ['ON_ROUTE','DELIVERED'].includes(selectedOrder.status) ? 'bg-green-500 shadow-green-100' : 'bg-slate-200'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">En Ruta</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-[3px] border-white shadow-lg shrink-0 ${
                      selectedOrder.status === 'DELIVERED' ? 'bg-green-500 shadow-green-100' : 
                      ['CANCELLED','RETURNED'].includes(selectedOrder.status) ? 'bg-red-400 shadow-red-100' : 'bg-slate-200'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        {selectedOrder.status === 'DELIVERED' ? 'Entregado' : 
                         selectedOrder.status === 'CANCELLED' ? 'Cancelado' : 
                         selectedOrder.status === 'RETURNED' ? 'Devuelto' : 'Destino'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Novedad Reason Display */}
                {selectedOrder.nonDeliveryReason && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-1">Motivo de Novedad</p>
                    <p className="text-xs font-bold text-red-800 italic">"{selectedOrder.nonDeliveryReason}"</p>
                  </div>
                )}

                {/* Action Buttons — Only for drivers, only for actionable statuses */}
                {driverName && !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(selectedOrder.status) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      className="py-5 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirmar</>}
                    </button>
                    <button 
                      disabled={isUpdating}
                      onClick={() => setIsNovedadOpen(true)}
                      className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <AlertTriangle size={18} className="text-amber-400" /> Novedad
                    </button>
                  </div>
                )}

                {!driverName && (
                  <div className="pt-2">
                    <button
                      disabled={isUpdating}
                      onClick={() => { setOrderToDelete(selectedOrder.id); setShowDeleteModal(true); }}
                      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50 border border-red-100"
                    >
                      {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Eliminar Pedido Fantasma
                    </button>
                  </div>
                )}

                {/* Already completed status banner */}
                {driverName && ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(selectedOrder.status) && (
                  <div className={`p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest ${
                    selectedOrder.status === 'DELIVERED' ? 'bg-green-50 text-green-600 border border-green-100' :
                    selectedOrder.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {React.createElement(statusMap[selectedOrder.status]?.icon || Info, { size: 16, className: 'inline mr-2' })}
                    Pedido {statusMap[selectedOrder.status]?.label}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Novedad Logic Modal */}
      <AnimatePresence>
        {isNovedadOpen && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsNovedadOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, y: 60 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 60 }}
               transition={{ type: 'spring', damping: 30, stiffness: 350 }}
               className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10"
             >
                {/* Close Button */}
                <button 
                  onClick={() => setIsNovedadOpen(false)}
                  className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                >
                  <X size={18} />
                </button>

                <div className="p-8 sm:p-10 space-y-6">
                   <div className="space-y-2 pr-10">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Gestión de Incidencias</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">¿Qué sucedió con el pedido?</h3>
                   </div>

                   <div className="flex gap-3">
                      {(['CANCELLED', 'RETURNED'] as const).map(status => (
                         <button
                           key={status}
                           onClick={() => setNovedadStatus(status)}
                           className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                             novedadStatus === status 
                               ? 'bg-slate-900 text-white shadow-xl' 
                               : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                           }`}
                         >
                            {status === 'CANCELLED' 
                              ? <div className="flex items-center justify-center gap-2"><XCircle size={14}/> Cancelado</div> 
                              : <div className="flex items-center justify-center gap-2"><AlertTriangle size={14}/> Devuelto</div>
                            }
                         </button>
                      ))}
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Motivo detallado (Obligatorio)</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-200 min-h-[100px] resize-none transition-all"
                        placeholder="Ej: Cliente no se encontraba en casa, dirección incorrecta..."
                        value={novedadReason}
                        onChange={(e) => setNovedadReason(e.target.value)}
                      />
                   </div>

                   <button
                     disabled={!novedadReason.trim() || isUpdating}
                     onClick={() => handleUpdateStatus(selectedOrder.id, novedadStatus, novedadReason)}
                     className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                   >
                      {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Reporte'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DestructiveActionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => orderToDelete && handleDeleteOrder(orderToDelete)}
        title="ELIMINAR PEDIDO CRÍTICO"
        description="Esta acción eliminará permanentemente el registro de este pedido 'fantasma'. Asegúrate de que no esté asignado a ningún proceso activo antes de continuar."
        confirmText="ELIMINAR DEFINITIVAMENTE"
        itemName={selectedOrder?.clientReference || `Pedido #${orderToDelete}`}
        isLoading={isUpdating}
      />
    </div>
  );
};
