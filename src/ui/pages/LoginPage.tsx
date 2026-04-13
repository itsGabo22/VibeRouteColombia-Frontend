import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, Package, ShieldCheck, Truck, Settings, User } from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import logo from '../../shared/assets/viberoute-logo.png';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'LOGISTICS' | 'DRIVER'>('LOGISTICS');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setAuth  = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // SOLO enviamos email y password para evitar ruido en el Network Tab
      const { data } = await api.post('/auth/login', { email, password });
      
      // Obtenemos el token y los datos del usuario de la respuesta
      const { token, user } = data;
      const tokenRole = user.role.replace('ROLE_', '');

      // Validación cruzada para seguridad operativa
      if (tokenRole !== selectedRole && !(tokenRole === 'ADMIN' && selectedRole === 'LOGISTICS')) {
        setError(`Credenciales válidas, pero no tienes permisos de ${selectedRole}.`);
        setIsLoading(false);
        return;
      }

      setAuth(token, tokenRole, email, user.name);
      navigate('/');
    } catch (err: any) {
      setError('Error de autenticación. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'ADMIN', label: 'Admin', icon: Settings, color: 'blue' },
    { id: 'LOGISTICS', label: 'Logística', icon: Truck, color: 'green' },
    { id: 'DRIVER', label: 'Conductor', icon: User, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 selection:bg-green-100">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-100/40 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1100px] h-auto lg:h-[700px] bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row relative z-10 border border-slate-100"
      >
        {/* Banner Lateral */}
        <div className="hidden lg:flex lg:w-2/5 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-transparent" />
          </div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-10 shadow-2xl">
              <img src={logo} alt="VibeRoute" className="w-8 h-8" />
            </div>
            
            <h2 className="text-white text-4xl font-black tracking-tighter leading-tight mb-6">
              VibeRoute <br/><span className="text-green-400">Colombia</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
              Portal centralizado de sincronización logística nacional. Acceso restringido para personal autorizado.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest mb-1">
                   <ShieldCheck size={14} /> Security Compliance
                </div>
                <p className="text-[10px] text-slate-500">Sesión encriptada mediante AES-256 JWT</p>
             </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 p-12 lg:p-20 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Ingreso al Sistema</h1>
            <p className="text-slate-400 text-sm font-medium">Selecciona tu rol operativo para continuar</p>
          </div>

          {/* Selector de Rol Visual */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id as any)}
                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                  selectedRole === role.id 
                  ? 'border-green-500 bg-green-50/50' 
                  : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  selectedRole === role.id ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-white text-slate-400 shadow-sm'
                }`}>
                  <role.icon size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  selectedRole === role.id ? 'text-green-600' : 'text-slate-400'
                }`}>{role.label}</span>
                
                {selectedRole === role.id && (
                  <motion.div layoutId="role-indicator" className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Credential ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-900 pl-12 pr-6 py-4 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  placeholder="usuario@viberoute.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Secret Pass</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-900 pl-12 pr-6 py-4 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4 h-14"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase text-xs font-black tracking-[0.2em]">Sincronizar Panel</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2">
             <div className="h-px w-8 bg-slate-100" />
             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Global Logistics Infrastructure</span>
             <div className="h-px w-8 bg-slate-100" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
