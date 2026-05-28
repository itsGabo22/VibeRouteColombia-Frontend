import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Shield, 
  Activity, 
  Users, 
  Trash2, 
  Download, 
  Database, 
  RefreshCcw,
  LogOut,
  AlertTriangle,
  Cpu,
  Unplug,
  UserPlus,
  X,
  Edit3,
  Save,
  Lock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../app/store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/lib/api';
import { DestructiveActionModal } from '../components/DestructiveActionModal';
import { UserManagementModule } from '../../features/users/UserManagementModule';

interface SystemLog {
  id: number;
  timestamp: string;
  userEmail: string;
  action: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT';
  details: string;
}

interface GenericUser {
  id: number;
  email: string;
  name: string;
  role: string;
  assignedCity: string;
  phone?: string;
  pendingPasswordReset?: boolean;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [users, setUsers] = useState<GenericUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uptime, setUptime] = useState('00:00:00');
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, user: GenericUser | null}>({
    isOpen: false,
    user: null
  });
  const [editModal, setEditModal] = useState<{isOpen: boolean, user: GenericUser | null, formData: any}>({
    isOpen: false,
    user: null,
    formData: { name: '', role: '', phone: '', assignedCity: '', password: '', costPerHour: 15000 }
  });
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        api.get('/system/logs?limit=50'),
        api.get('/system/users')
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching system data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh logs cada 10s
    
    // Simular Uptime
    const start = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      await api.delete(`/system/users/${deleteModal.user.id}`);
      setDeleteModal({ isOpen: false, user: null });
      fetchData();
    } catch (err) {
      alert('Error en la eliminación crítica. Verifica permisos.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.user) return;
    try {
      const payload = { ...editModal.formData };
      if (payload.password) {
        payload.password = btoa(payload.password);
      } else {
        delete payload.password; // no enviar password vacio si no lo cambiaron
      }
      
      await api.put(`/system/users/${editModal.user.id}`, payload);
      setEditModal({ isOpen: false, user: null, formData: {} });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al editar usuario.');
    }
  };

  const handleResolveReset = async (userId: number, approved: boolean) => {
    try {
      await api.post(`/system/users/${userId}/resolve-reset?approved=${approved}`);
      fetchData(); // Refrescar para limpiar botones
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al resolver la solicitud.');
    }
  };

  const downloadLogs = () => {
    const content = logs.map(l => `[${l.timestamp}] ${l.severity} - ${l.userEmail}: ${l.action} -> ${l.details}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viberoute_audit_${new Date().toISOString()}.txt`;
    a.click();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Amber Retro Theme Colors
  const amber = {
    text: '#FFB000',
    bg: '#0D0A00',
    border: 'rgba(255, 176, 0, 0.2)',
    accent: 'rgba(255, 176, 0, 0.1)',
    high: '#FFCC00'
  };

  return (
    <div className="min-h-screen font-mono p-8 selection:bg-amber-500/30 selection:text-white" style={{ backgroundColor: amber.bg, color: amber.text }}>
      
      {/* SCANLINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[999] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-amber-500/20 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Terminal size={24} className="animate-pulse" />
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              System<span className="text-white">Consola</span>
              <span className="ml-2 text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded italic font-bold">V-2.4-STABLE</span>
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-60">Architect Access // {user?.email}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="px-6 py-3 border border-amber-500/30 rounded-xl bg-amber-500/5 flex flex-col items-center">
            <span className="text-[8px] uppercase tracking-widest opacity-50">Local Uptime</span>
            <span className="text-sm font-bold">{uptime}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 hover:bg-rose-500 hover:text-black border border-amber-500/30 hover:border-transparent rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={16} /> Disconnect
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: LOGS */}
        <div className="xl:col-span-2 space-y-8">
          <section className="border border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_0_30px_-10px_rgba(255,176,0,0.1)]">
            <div className="bg-amber-500/10 p-5 border-b border-amber-500/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Activity size={18} />
                <h2 className="text-xs font-black uppercase tracking-[0.3em]">System Audit Wall</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchData} className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors">
                  <RefreshCcw size={14} />
                </button>
                <button onClick={downloadLogs} className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors text-amber-400">
                  <Download size={14} />
                </button>
              </div>
            </div>
            
            <div className="h-[500px] overflow-y-auto p-6 space-y-3 font-mono text-[11px] leading-relaxed bg-[#050505] scrollbar-thin scrollbar-thumb-amber-500/20">
              {logs.length === 0 && <p className="opacity-40 italic text-center py-20">Awaiting system incoming events...</p>}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 group border-b border-white/5 pb-2 last:border-0">
                  <span className="opacity-30 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold w-20 ${
                    log.severity === 'CRITICAL' ? 'text-rose-500' : 
                    log.severity === 'WARNING' ? 'text-amber-300' : 
                    log.severity === 'AUDIT' ? 'text-sky-400' : 'text-amber-500/60'
                  }`}>
                    {log.severity}
                  </span>
                  <div className="flex-1">
                    <span className="text-white/40 italic">{log.userEmail}:</span>
                    <span className="ml-2 font-bold">{log.action}</span>
                    <p className="opacity-50 mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>

          {/* SYSTEM HARDWARE STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-6 border border-amber-500/10 bg-amber-500/5 rounded-3xl flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Cpu size={24} className="opacity-50" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] uppercase tracking-widest opacity-40">Processor Load</p>
                   <div className="flex items-center gap-4">
                      <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: ['12%', '45%', '33%'] }} 
                          transition={{ repeat: Infinity, duration: 8 }}
                          className="h-full bg-amber-500" 
                        />
                      </div>
                      <span className="text-xs font-bold">12.5%</span>
                   </div>
                </div>
             </div>
             <div className="p-6 border border-amber-500/10 bg-amber-500/5 rounded-3xl flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Database size={24} className="opacity-50" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] uppercase tracking-widest opacity-40">Thread Memory</p>
                   <div className="flex items-center gap-4">
                      <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ width: ['60%', '62%', '61%'] }} 
                          transition={{ repeat: Infinity, duration: 15 }}
                          className="h-full bg-amber-500" 
                        />
                      </div>
                      <span className="text-xs font-bold">61%</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* PANEL DERECHO: USER LIST */}
        <aside className="space-y-8">
          <section className="border border-amber-500/30 rounded-3xl overflow-hidden bg-amber-500/5 h-[800px] flex flex-col">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} />
                <h2 className="text-xs font-black uppercase tracking-[0.3em]">Master User Index</h2>
              </div>
              <button 
                onClick={() => setIsManagementOpen(true)}
                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(255,176,0,0.3)]"
              >
                <UserPlus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {users.map((u) => (
                <div key={u.id} className="p-4 border border-amber-500/10 rounded-2xl bg-black/40 hover:bg-amber-500/10 transition-all flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{u.name}</p>
                    <p className="text-[9px] opacity-40 uppercase tracking-tighter">{u.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`text-[8px] px-2 py-0.5 rounded font-black border ${
                         u.role === 'SUPER_ADMIN' ? 'border-rose-500/50 text-rose-500 bg-rose-500/5' :
                         u.role === 'ADMIN' ? 'border-sky-500/50 text-sky-500 bg-sky-500/5' :
                         'border-amber-500/30 text-amber-500'
                       }`}>
                         {u.role}
                       </span>
                       {u.pendingPasswordReset && (
                         <span className="text-[8px] px-2 py-0.5 rounded font-black border border-amber-500/80 text-amber-500 bg-amber-500/10 animate-pulse flex items-center gap-1">
                           <Lock size={8} /> RESET PENDIENTE
                         </span>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.pendingPasswordReset && (
                      <div className="flex bg-black/40 border border-amber-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_-3px_rgba(255,176,0,0.4)]">
                        <button 
                          onClick={() => handleResolveReset(u.id, true)} 
                          className="p-2.5 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Aprobar Cambio de Clave"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleResolveReset(u.id, false)} 
                          className="p-2.5 text-rose-500 hover:bg-rose-500/20 transition-all border-l border-white/10"
                          title="Denegar Cambio de Clave"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex bg-black/40 border border-amber-500/10 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-all">
                      {u.role !== 'SUPER_ADMIN' && (
                        <>
                        <button 
                          onClick={() => setEditModal({ 
                            isOpen: true, 
                            user: u, 
                            formData: { 
                              name: u.name, 
                              role: u.role, 
                              assignedCity: u.assignedCity, 
                              password: '', // En blanco = sin cambios
                              phone: u.phone || '', // Tomado de la entidad real
                              costPerHour: 15000
                            } 
                          })}
                          className="p-3 text-sky-400 hover:bg-sky-500/20 transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, user: u })}
                          className="p-3 text-rose-500 hover:bg-rose-500/20 transition-all border-l border-white/5"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

            <div className="p-6 bg-rose-500/5 border-t border-rose-500/20 italic">
               <div className="flex gap-3 text-rose-500">
                  <AlertTriangle size={14} className="mt-0.5" />
                  <p className="text-[9px] font-bold leading-relaxed uppercase tracking-tighter">
                    ADVERTENCIA: LAS ELIMINACIONES SON IRREVERSIBLES. TODOS LOS ASSETS ASOCIADOS (RUTAS, PEDIDOS) PODRÍAN QUEDAR HUÉRFANOS.
                  </p>
               </div>
            </div>
          </section>
        </aside>

      </div>

      <DestructiveActionModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Eliminación Crítica Detectada"
        description="Esta acción eliminará permanentemente al usuario del ecosistema Viberoute. Se registrará una entrada de auditoría CRÍTICA asociada a tu firma digital."
        confirmText="CONFIRMAR"
        itemName={deleteModal.user?.name || ''}
      />

      {/* Edit User Modal */}
      <AnimatePresence>
        {editModal.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050505] border border-amber-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(255,176,0,0.2)]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <Edit3 className="text-amber-500" size={20} />
                  <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Edición de Perfil</h3>
                </div>
                <button onClick={() => setEditModal({isOpen: false, user: null, formData: {}})} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Correo (No Editable)</label>
                  <input readOnly value={editModal.user?.email || ''} className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-white/50 focus:outline-none pointer-events-none text-xs" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Nombre Completo</label>
                  <input type="text" required value={editModal.formData.name || ''} onChange={(e) => setEditModal({...editModal, formData: {...editModal.formData, name: e.target.value}})} className="w-full bg-black border border-white/10 focus:border-amber-500/50 px-4 py-3 rounded-lg text-white focus:outline-none text-xs transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Rol</label>
                    <select required value={editModal.formData.role || ''} onChange={(e) => setEditModal({...editModal, formData: {...editModal.formData, role: e.target.value}})} className="w-full bg-black border border-white/10 focus:border-amber-500/50 px-4 py-3 rounded-lg text-white focus:outline-none text-xs transition-colors">
                      <option value="DRIVER">DRIVER</option>
                      <option value="LOGISTICS">LOGISTICS</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Ciudad</label>
                    <input type="text" required value={editModal.formData.assignedCity || ''} onChange={(e) => setEditModal({...editModal, formData: {...editModal.formData, assignedCity: e.target.value}})} className="w-full bg-black border border-white/10 focus:border-amber-500/50 px-4 py-3 rounded-lg text-white focus:outline-none text-xs transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Línea Telefónica</label>
                  <input type="text" placeholder="+57 300 000 0000" required value={editModal.formData.phone || ''} onChange={(e) => setEditModal({...editModal, formData: {...editModal.formData, phone: e.target.value}})} className="w-full bg-black border border-white/10 focus:border-amber-500/50 px-4 py-3 rounded-lg text-white focus:outline-none text-xs transition-colors" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Nueva Contraseña (Opcional)</label>
                  <div className="relative">
                    <input type="text" placeholder="Dejar en blanco si no cambia" value={editModal.formData.password || ''} onChange={(e) => setEditModal({...editModal, formData: {...editModal.formData, password: e.target.value}})} className="w-full bg-[#111] border border-rose-500/30 focus:border-rose-500 px-4 py-3 rounded-lg text-white focus:outline-none text-xs transition-colors placeholder:text-white/20" />
                    <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500/50" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-amber-500 text-black uppercase font-black tracking-widest py-4 rounded-xl text-xs hover:bg-amber-400 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                   <Save size={16} /> GUARDAR ALTERACIÓN
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Management Sub-System Modal */}
      <AnimatePresence>
        {isManagementOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#F0FDFA] w-full max-w-6xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col font-sans"
            >
               <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                        <Users size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800 italic uppercase leading-none">Subsistema de Gestión</h3>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">Nivel de Acceso: Architect</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => {
                        setIsManagementOpen(false);
                        fetchData(); // Refrescar lista de usuarios al cerrar
                    }} 
                    className="p-3 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                  <UserManagementModule />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
