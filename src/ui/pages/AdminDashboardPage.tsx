import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  LogOut,
  Bell,
  Search,
  Plus,
  ArrowRight,
  Database,
  LineChart,
  Truck,
  FileText,
  ShieldCheck,
  Package,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import { OrdersManagementModule } from '../../features/orders/OrdersManagementModule';
import { LiveEventsWall } from '../../features/orders/LiveEventsWall';
import { FleetManagementHome } from '../../features/analytics/FleetManagementHome';
import { BulkImportModule } from '../../features/bulk/BulkImportModule';
import { DocumentHubModule } from '../../features/reports/DocumentHubModule';
import { LogisticsDispatchCenter } from '../../features/dispatch/LogisticsDispatchCenter';
import { BatchConsolidationModule } from '../../features/dispatch/BatchConsolidationModule';
import { UserManagementModule } from '../../features/users/UserManagementModule';

type AdminTab = 'dashboard' | 'orders' | 'live' | 'analytics' | 'import' | 'reports' | 'dispatch' | 'batchConsolidation' | 'users';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>(user?.assignedCity || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLogistica = user?.role === 'LOGISTICS';
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Monitor de Flota', icon: LayoutDashboard },
    ...(isLogistica ? [
      { id: 'orders', label: 'Ver Pedidos', icon: Database },
      { id: 'batchConsolidation', label: 'Consolidar Lotes', icon: Plus },
      { id: 'dispatch', label: 'Despacho de Lotes', icon: Package },
    ] : []),
    ...(isAdmin ? [
      { id: 'import', label: 'Carga Masiva', icon: Database },
      { id: 'users', label: 'Gestión Personal', icon: Users },
    ] : []),
    { id: 'reports', label: 'Reportes y Cierres', icon: FileText },
    { id: 'live', label: 'Eventos Real-Time', icon: Bell },
  ];

  // Set default tab based on role if current is not available
  React.useEffect(() => {
    if (isAdmin && activeTab === 'dispatch') setActiveTab('dashboard');
    if (isLogistica && activeTab === 'import') setActiveTab('dispatch');
  }, [isAdmin, isLogistica]);

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex font-sans">
      
      {/* Sidebar Style Fleet Management */}
      <aside className="w-72 bg-teal-900 text-white flex flex-col fixed h-full z-40">
        <div className="p-8 flex flex-col items-center">
           <div className="flex flex-col items-center justify-center gap-3 mb-10 w-full text-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                 <Truck size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                Fleet<span className="text-emerald-400">Manage</span>
                <span className="block text-[10px] text-teal-400 tracking-[0.3em] font-bold mt-1">VibeRoute Colombia</span>
              </h1>
           </div>

           <nav className="space-y-1 w-full">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === item.id 
                    ? 'bg-white/10 text-emerald-400 border-l-4 border-emerald-400' 
                    : 'text-teal-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
           </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 p-0.5">
                 <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`} className="rounded-full" alt="User" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {user?.role === 'ADMIN' ? 'Control Central' : `Operador ${user?.assignedCity || 'Logística'}`}
                 </p>
                 <p className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
             <LogOut size={16} /> Cerrar Sesión
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-10 min-h-screen">
        
        {/* Fleet Header */}
        <header className="flex justify-between items-center mb-10">
           <div className="relative">
              <div className="flex items-center gap-3 text-teal-600 mb-2">
                 <ShieldCheck size={14} />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">SISTEMA DE GESTIÓN VIGENTE</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
                {navItems.find(t => t.id === activeTab)?.label}
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                 <Search size={16} className="text-slate-400" />
                 <input 
                  type="text" 
                  placeholder="Buscar en flota..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold w-48" 
                 />
              </div>

           </div>
        </header>

        {/* Dynamic Navigation View */}
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             transition={{ duration: 0.3 }}
           >
              {activeTab === 'dashboard' && <FleetManagementHome city={selectedCity} onCityChange={setSelectedCity} searchQuery={searchQuery} />}

              {activeTab === 'orders' && (
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <OrdersManagementModule driverName="" forceCity={selectedCity} searchQuery={searchQuery} />
                </div>
              )}

              {activeTab === 'dispatch' && <LogisticsDispatchCenter city={selectedCity} searchQuery={searchQuery} />}

              {activeTab === 'reports' && (
                <DocumentHubModule mode={user?.role === 'ADMIN' ? 'admin' : 'logistica'} />
              )}

              {activeTab === 'import' && (
                 <BulkImportModule onComplete={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'batchConsolidation' && (
                 <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-6">Consolidación de <span className="text-teal-600">Lotes</span></h2>
                    <BatchConsolidationModule city={selectedCity} searchQuery={searchQuery} onComplete={() => setActiveTab('dispatch')} />
                 </div>
              )}

              {activeTab === 'live' && (
                 <LiveEventsWall />
              )}

              {activeTab === 'users' && (
                 <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <UserManagementModule />
                 </div>
              )}
           </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
};
