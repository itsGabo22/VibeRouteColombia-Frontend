import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronLeft, Loader2, Package } from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../shared/lib/api';
import bgLogistics from '../../../shared/assets/bg-logistics.png';
import logo from '../../../shared/assets/viberoute-logo.png';

export const LogisticsLoginPage: React.FC = () => {
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
      const { data } = await api.post('/auth/login', { email, password });
      const token: string = data.token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const authorities: string[] = payload.authorities || [];
      const tokenRole = authorities[0]?.replace('ROLE_', '') ?? '';

      if (tokenRole !== 'LOGISTICS' && tokenRole !== 'ADMIN') {
        setError('Acceso denegado: Portal exclusivo de Logística.');
        setIsLoading(false);
        return;
      }

      setAuth(token, tokenRole, email);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciales incorrectas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex bg-[#050A09] selection:bg-primary/30 font-sans"
    >
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center transition-all duration-1000 relative overflow-hidden"
        style={{ backgroundImage: `url(${bgLogistics})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[#0c1a16]/50 backdrop-grayscale-[0.3]" />
        
        <div className="h-full w-full relative z-10 flex flex-col p-16 justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="Logo" className="w-14 h-14 rounded-2xl shadow-2xl" />
            <span className="text-white text-2xl font-black tracking-tighter transition-all hover:tracking-normal cursor-default">VibeRoute</span>
          </motion.div>

          <div className="text-white">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl font-black mb-6 tracking-tight leading-tight"
            >
              Logística <br/><span className="text-primary italic">VibeRoute Colombia</span>
            </motion.h2>
            <p className="text-lg text-gray-400 font-light max-w-md leading-relaxed">
              Gestión centralizada de suministros y carga para la flota nacional de Colombia.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col relative overflow-hidden bg-[#0A0F0E]">
        <div className="p-8 pb-0">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-full"
          >
            <ChevronLeft size={14} /> Volver al Inicio
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:p-24 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            <div className="mb-12">
               <div className="flex items-center gap-2 mb-4 text-primary">
                  <Package size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">CENTRO OPERATIVO</span>
               </div>
               <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">LOGÍSTICA</h1>
               <p className="text-gray-500 font-medium">Ingresa para gestionar la operación</p>
            </div>

            <AnimatePresence>
                {error && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-8 p-4 bg-red-500/10 text-red-200 rounded-2xl text-xs border border-red-500/20 text-center"
                >
                    {error}
                </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-2">NOMBRE DE USUARIO</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 text-white pl-14 pr-6 py-4 rounded-2xl focus:border-primary/50 outline-none transition-all placeholder:text-gray-700"
                    placeholder="logistica@viberoute.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-2">CONTRASEÑA</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 text-white pl-14 pr-6 py-4 rounded-2xl focus:border-primary/50 outline-none transition-all placeholder:text-gray-700 font-mono"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-[#2ae088] text-primary-dark font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4 overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="uppercase text-xs tracking-[0.2em]">INGRESAR AL SISTEMA</span>
                    <LogIn size={18} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
