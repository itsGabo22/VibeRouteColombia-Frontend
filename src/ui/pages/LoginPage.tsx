import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';
import logo from '../../shared/assets/viberoute-logo.png';

export const LoginPage: React.FC = () => {
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
      // Codificamos la contraseña en Base64 para que no sea visible en texto plano en el Network Tab
      const encodedPassword = btoa(password);
      const { data } = await api.post('/auth/login', { email, password: encodedPassword });
      
      // Obtenemos el token y los datos del usuario de la respuesta
      const { token, user } = data;
      const tokenRole = user.role.replace('ROLE_', '');

      // El rol se detecta automáticamente del token devuelto por el backend
      setAuth(token, tokenRole, email, user.name, user.assignedCity);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Acceso denegado: Credenciales incorrectas o no autorizadas.');
      } else {
        setError('Error de conexión con el servidor logístico.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4 sm:p-6 selection:bg-green-100">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-100/40 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1100px] h-auto lg:h-[700px] bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row relative z-10 border border-slate-100"
      >
        {/* Banner Lateral - Oculto en móviles, visible en LG */}
        <div className="hidden lg:flex lg:w-2/5 bg-slate-900 p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-transparent" />
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform hover:scale-105 duration-500">
              <img src={logo} alt="VibeRoute" className="w-12 h-12 object-contain" />
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

        {/* Formulario - Principal */}
        <div className="flex-1 p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-white">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
              <img src={logo} alt="VibeRoute" className="w-10 h-10 object-contain invert brightness-0" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">Acceso <span className="text-green-500">Operativo</span></h1>
            <p className="text-slate-400 text-sm font-medium tracking-tight">Ingresa tus credenciales para sincronizar tu panel</p>
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">ID de Usuario</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" size={18} />
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Contraseña Secreta</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-green-500 transition-colors" size={18} />
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
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 sm:py-5 rounded-2xl transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-6 h-14 sm:h-16"
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

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
             <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-slate-100" />
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Infraestructura VibeRoute</span>
                <div className="h-px w-8 bg-slate-100" />
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
