import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, ShieldCheck, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../shared/lib/api';
import cityBg from '../../../shared/assets/city-bg.png';
import logo from '../../../shared/assets/viberoute-logo.png';

export const AdminLoginPage: React.FC = () => {
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

      if (tokenRole !== 'ADMIN') {
        setError('Acceso denegado: Rango insuficiente.');
        setIsLoading(false);
        return;
      }

      setAuth(token, tokenRole, email);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        className="absolute inset-0 bg-cover bg-center grayscale mix-blend-luminosity"
        style={{ backgroundImage: `url(${cityBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent" />

      <div className="relative z-10 w-full max-w-lg p-8">
        <motion.button 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             onClick={() => navigate('/login')}
             className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em] mb-12 hover:bg-white/5 px-4 py-2 rounded-full border border-indigo-500/10"
        >
             <ChevronLeft size={14} /> VOLVER AL PORTAL
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f172a]/60 border border-white/5 rounded-[2.5rem] shadow-2xl p-12 backdrop-blur-3xl"
        >
          <div className="flex flex-col items-center mb-12">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src={logo} 
              alt="Logo" 
              className="w-20 h-20 rounded-3xl shadow-2xl mb-6 shadow-indigo-500/20 cursor-pointer" 
            />
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Control Central</h1>
              <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.4em]">ADMINISTRADOR VIBEROUTE</p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-950/30 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5 px-2">
              <label className="text-[9px] font-black text-[#475569] uppercase tracking-[0.3em] ml-1">NOMBRE DE USUARIO</label>
              <div className="relative group">
                <Fingerprint className="absolute left-0 top-1/2 -translate-y-1/2 text-[#334155] group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 text-white pl-8 pr-4 py-3 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[#1e293b] text-sm font-medium"
                  placeholder="admin@viberoute.net"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 px-2">
              <label className="text-[9px] font-black text-[#475569] uppercase tracking-[0.3em] ml-1">CONTRASEÑA</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#334155] group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 text-white pl-8 pr-4 py-3 focus:border-indigo-500/50 outline-none transition-all placeholder:text-[#1e293b] text-sm tracking-[0.5em]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-slate-950 hover:bg-indigo-500 hover:text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-white/5 uppercase text-[10px] tracking-[0.3em] mt-8 group active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} className="group-hover:rotate-12 transition-transform" />
                  INGRESAR AL SISTEMA
                  <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform opacity-30" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
