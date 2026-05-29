import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, MapPin, User, Package, Clock, 
  CheckCircle2, XCircle, ChevronRight, Navigation, Loader2,
  Info, AlertTriangle, X, Trash2, FileText, ChevronLeft,
  SlidersHorizontal, ArrowUp, ArrowDown, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { useRouteStore } from '../../app/store/routeStore';
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
  driverEmail?: string;
  vehicle?: string;
  vehiclePlate?: string;
  batchName?: string;
  batchId?: number | string | null;
}

type SortField = 'priority' | 'status' | 'address' | 'createdAt' | 'driverName';
type SortDirection = 'asc' | 'desc';

interface AdvancedFilters {
  priority: string;
  status: string;
  driver: string;
  city: string;
  date: string;
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
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    priority: 'ALL',
    status: 'ALL',
    driver: 'ALL',
    city: 'ALL',
    date: '',
  });
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<30 | 60 | 100>(30);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setIsAdvancedFiltersOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = driverName ? '/orders/mine' : '/orders';
      const { data: allOrdersFromApi } = await api.get(endpoint);
      
      let allOrders: Order[] = allOrdersFromApi.map((o: any) => ({
        ...o,
        driverName: o.driverName || driverName || 'Sin Asignar'
      }));
      
      if (forceCity) {
        allOrders = allOrders.filter(o => o.city?.toLowerCase() === forceCity.toLowerCase());
      }

      setOrders(allOrders);

      if (driverName) {
        useRouteStore.getState().setBackupOrders(allOrdersFromApi);
      }
      
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
      if (driverName) {
        const { backupOrders, setBackupOrders } = useRouteStore.getState();
        setBackupOrders(
          backupOrders.map((o) =>
            o.id === orderId ? { ...o, status: nextStatus, nonDeliveryReason: reason } : o
          )
        );
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
      const cleanCity = (activeCity || '').trim();
      const escapeCell = (value: unknown) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const rows = filteredOrders.map(order => ({
        id: order.id,
        reference: order.clientReference,
        client: order.clientName,
        address: order.address,
        city: order.city,
        driver: order.driverName,
        priority: priorityMap[order.priority]?.label || order.priority,
        status: statusMap[order.status]?.label || order.status,
        batch: order.batchName || order.batchId || '',
        createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : '',
      }));

      const tableHtml = `
        <html>
          <head><meta charset="UTF-8" /></head>
          <body>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Ciudad</th>
                  <th>Conductor</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Lote</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    <td>${escapeCell(row.id)}</td>
                    <td>${escapeCell(row.reference)}</td>
                    <td>${escapeCell(row.client)}</td>
                    <td>${escapeCell(row.address)}</td>
                    <td>${escapeCell(row.city)}</td>
                    <td>${escapeCell(row.driver)}</td>
                    <td>${escapeCell(row.priority)}</td>
                    <td>${escapeCell(row.status)}</td>
                    <td>${escapeCell(row.batch)}</td>
                    <td>${escapeCell(row.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Aseguramos que el nombre del archivo refleje la ciudad REAL
      const fileName = cleanCity ? `Lista_Pedidos_${cleanCity}_Filtrado.xls` : 'Reporte_Pedidos_Filtrado.xls';
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setDriverFilter('ALL');
    setAdvancedFilters({
      priority: 'ALL',
      status: 'ALL',
      driver: 'ALL',
      city: 'ALL',
      date: '',
    });
    setSortConfig(null);
    setIsAdvancedFiltersOpen(false);
    setCurrentPage(1);
    setSelectedIds([]);
    fetchOrders();
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
    'PENDING': { label: 'PENDIENTE', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'ON_ROUTE': { label: 'EN RUTA', color: 'bg-blue-100 text-blue-700', icon: Navigation },
    'DELIVERED': { label: 'ENTREGADO', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    'CANCELLED': { label: 'CANCELADO', color: 'bg-red-100 text-red-700', icon: XCircle },
    'RETURNED': { label: 'DEVUELTO', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  };

  const priorityMap: any = {
    'HIGH': { label: 'ALTA', color: 'bg-red-100 text-red-700' },
    'MEDIUM': { label: 'MEDIA', color: 'bg-amber-100 text-amber-700' },
    'LOW': { label: 'BAJA', color: 'bg-slate-100 text-slate-600' },
  };

  const uniqueCities = useMemo(
    () => Array.from(new Set(orders.map(order => order.city).filter(Boolean))).sort(),
    [orders]
  );

  const hasActiveFilters =
    filterStatus !== 'ALL' ||
    driverFilter !== 'ALL' ||
    advancedFilters.priority !== 'ALL' ||
    advancedFilters.status !== 'ALL' ||
    advancedFilters.driver !== 'ALL' ||
    advancedFilters.city !== 'ALL' ||
    Boolean(advancedFilters.date) ||
    Boolean(searchTerm.trim()) ||
    Boolean(sortConfig);

  const priorityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusRank: Record<string, number> = { PENDING: 3, ON_ROUTE: 2, DELIVERED: 1, CANCELLED: 0, RETURNED: 0 };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = orders.filter(order => {
      const searchableValues = [
        order.id,
        order.clientReference,
        order.clientName,
        order.address,
        order.driverName,
        order.driverEmail,
        order.vehicle,
        order.vehiclePlate,
        priorityMap[order.priority]?.label,
        order.priority,
        statusMap[order.status]?.label,
        order.status,
        order.city,
        order.batchName,
        order.batchId,
      ];

      const matchesSearch = !normalizedSearch || searchableValues
        .map(value => String(value ?? '').toLowerCase())
        .some(value => value.includes(normalizedSearch));

      const effectiveStatus = advancedFilters.status !== 'ALL' ? advancedFilters.status : filterStatus;
      const effectiveDriver = advancedFilters.driver !== 'ALL' ? advancedFilters.driver : driverFilter;

      const matchesStatus = effectiveStatus === 'ALL' || order.status === effectiveStatus;
      const matchesDriver = effectiveDriver === 'ALL' || order.driverName === effectiveDriver;
      const matchesPriority = advancedFilters.priority === 'ALL' || order.priority === advancedFilters.priority;
      const matchesCity = advancedFilters.city === 'ALL' || order.city === advancedFilters.city;
      const matchesDate = !advancedFilters.date || (order.createdAt || '').slice(0, 10) === advancedFilters.date;

      return matchesSearch && matchesStatus && matchesDriver && matchesPriority && matchesCity && matchesDate;
    });

    if (!sortConfig) return result;

    return [...result].sort((a, b) => {
      let comparison = 0;

      if (sortConfig.field === 'priority') {
        comparison = (priorityRank[a.priority] ?? 0) - (priorityRank[b.priority] ?? 0);
      } else if (sortConfig.field === 'status') {
        comparison = (statusRank[a.status] ?? 0) - (statusRank[b.status] ?? 0);
      } else if (sortConfig.field === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else {
        comparison = String(a[sortConfig.field] ?? '').localeCompare(String(b[sortConfig.field] ?? ''), 'es', {
          sensitivity: 'base',
        });
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [orders, searchTerm, filterStatus, driverFilter, advancedFilters, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, filterStatus, driverFilter, advancedFilters, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' };
      return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const SortableHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => {
    const isActive = sortConfig?.field === field;
    const SortIcon = sortConfig?.direction === 'asc' ? ArrowUp : ArrowDown;

    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`inline-flex items-center gap-1.5 text-left text-[10px] font-black uppercase tracking-widest transition-colors hover:text-slate-700 ${
          isActive ? 'text-slate-900' : 'text-slate-400'
        } ${className}`}
      >
        {children}
        {isActive && <SortIcon size={12} />}
      </button>
    );
  };

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = Math.min(pageStartIndex + rowsPerPage, filteredOrders.length);
  const paginatedOrders = filteredOrders.slice(pageStartIndex, pageEndIndex);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={19} />
            <input
              type="text"
              placeholder="Buscar por ID, referencia, cliente, destino, conductor, prioridad, estado, ciudad o lote..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
            <div ref={filtersRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAdvancedFiltersOpen(prev => !prev)}
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all sm:w-auto ${
                  isAdvancedFiltersOpen || hasActiveFilters
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal size={17} />
                Filtros Avanzados
              </button>

              <AnimatePresence>
                {isAdvancedFiltersOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full z-50 mt-3 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-95 sm:w-[420px]"
                  >
                    <button
                      type="button"
                      onClick={() => setIsAdvancedFiltersOpen(false)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">Filtros de operación</p>
                        <p className="text-xs font-medium text-slate-400">Combina criterios sin consultar de nuevo el backend.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridad</span>
                        <select
                          value={advancedFilters.priority}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">Todas</option>
                          <option value="HIGH">Alta</option>
                          <option value="MEDIUM">Media</option>
                          <option value="LOW">Baja</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                        <select
                          value={advancedFilters.status}
                          onChange={(e) => {
                            setAdvancedFilters(prev => ({ ...prev, status: e.target.value }));
                            setFilterStatus(e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">Todos</option>
                          <option value="PENDING">Pendiente</option>
                          <option value="ON_ROUTE">En ruta</option>
                          <option value="DELIVERED">Entregado</option>
                          <option value="CANCELLED">Cancelado</option>
                          <option value="RETURNED">Devuelto</option>
                        </select>
                      </label>

                      {!driverName && (
                        <label className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conductor</span>
                          <select
                            value={advancedFilters.driver}
                            onChange={(e) => {
                              setAdvancedFilters(prev => ({ ...prev, driver: e.target.value }));
                              setDriverFilter(e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="ALL">Todos los repartidores</option>
                            {availableDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </label>
                      )}

                      <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ciudad</span>
                        <select
                          value={advancedFilters.city}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">Todas las ciudades</option>
                          {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </label>

                      <label className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</span>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="date"
                            value={advancedFilters.date}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold text-slate-400">{filteredOrders.length} resultados visibles</p>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {!driverName && (
            <button 
               onClick={handleDownloadRegionalReport}
               disabled={isDownloading}
               className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-200/50 transition-all duration-200 hover:bg-emerald-700 disabled:opacity-50 sm:w-auto whitespace-nowrap"
            >
               {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
               Exportar Excel Regional
            </button>
          )}

          {!driverName && selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-md shadow-red-100 transition-all duration-200 hover:bg-red-600"
            >
              <Trash2 size={14} />
              Borrar {selectedIds.length}
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="border-b border-slate-100">
                {!driverName && (
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                <th className="px-4 py-3">
                  <SortableHeader field="createdAt">Fecha</SortableHeader>
                </th>
                <th className="px-4 py-3">
                  <SortableHeader field="address">Destino Operativo</SortableHeader>
                </th>
                {!driverName && (
                  <th className="px-4 py-3">
                    <SortableHeader field="driverName">Conductor</SortableHeader>
                  </th>
                )}
                <th className="px-4 py-3 text-center">
                  <SortableHeader field="priority" className="justify-center">Prioridad</SortableHeader>
                </th>
                <th className="px-4 py-3 text-center">
                  <SortableHeader field="status" className="justify-center">Estado</SortableHeader>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={driverName ? 6 : 8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando operaciones...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={driverName ? 6 : 8} className="p-32 text-center">
                  <Package className="mx-auto text-slate-200 mb-2" size={48} />
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Sin registros encontrados</p>
                </td></tr>
              ) : (
                paginatedOrders.map((order) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={order.id} 
                    className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {!driverName && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          checked={selectedIds.includes(order.id)}
                          onChange={(e) => toggleSelectOrder(e as any, order.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={13} className="text-slate-300" />
                        <span className="text-xs font-bold whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CO') : 'Sin fecha'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-slate-300 mt-1" />
                          <div>
                             <p className="text-sm font-black text-slate-700 tracking-tight">{order.address}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.city}</p>
                          </div>
                       </div>
                    </td>
                    {!driverName && (
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                            <User size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{order.driverName}</span>
                         </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                       <div className="flex justify-center">
                         <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${priorityMap[order.priority]?.color || 'bg-slate-100 text-slate-400'}`}>
                           {priorityMap[order.priority]?.label || order.priority}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex justify-center">
                         <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusMap[order.status]?.color || 'bg-slate-50 text-slate-400'}`}>
                           {React.createElement(statusMap[order.status]?.icon || Info, { size: 10 })}
                           {statusMap[order.status]?.label || order.status}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right">
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
        {!loading && filteredOrders.length > 0 && (
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Mostrando {filteredOrders.length === 0 ? 0 : pageStartIndex + 1}-{pageEndIndex} de {filteredOrders.length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por página</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value) as 30 | 60 | 100);
                    setCurrentPage(1);
                  }}
                  aria-label="Registros por página"
                  className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest appearance-none cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="30">30</option>
                  <option value="60">60</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-600">
                {Math.min(currentPage, totalPages)} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
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
