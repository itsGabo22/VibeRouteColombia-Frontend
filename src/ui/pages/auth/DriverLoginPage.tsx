import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  User, 
  Lock, 
  LogIn, 
  Loader2, 
  ArrowRightCircle
} from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../shared/lib/api';
import bgDriver from '../../../shared/assets/bg-driver.png';
import logo from '../../../shared/assets/viberoute-logo.png';

export const DriverLoginPage: React.FC = () => {
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

      if (tokenRole !== 'DRIVER' && tokenRole !== 'ADMIN') {
        setError('Acceso denegado: Solo repartidores.');
        setIsLoading(false);
        return;
      }

      setAuth(token, tokenRole, email);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Error de acceso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020403] flex flex-col relative overflow-hidden font-sans selection:bg-primary/20 text-white">
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute inset-0 bg-cover bg-center mix-blend-screen scale-x-[-1]"
        style={{ backgroundImage: `url(${bgDriver})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <header className="relative z-20 p-6">
        <button 
          onClick={() => navigate('/login')}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20 max-w-lg mx-auto w-full">
        <div className="w-full">
          <div className="mb-12 text-center flex flex-col items-center">
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={logo} 
              alt="Logo" 
              className="w-24 h-24 mb-6 drop-shadow-[0_0_15px_rgba(46,204,127,0.3)]"
            />
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase leading-none">
              REPARTIDOR <br/><span className="text-primary italic">VibeRoute</span>
            </h1>
            <p className="text-gray-500 font-medium tracking-tight">Ingresa para ver tus rutas del día</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">NOMBRE DE USUARIO</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0c0b] border border-white/5 text-white pl-14 pr-6 py-5 rounded-2xl focus:border-primary/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                  placeholder="conductor@viberoute.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">CONTRASEÑA</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c0b] border border-white/5 text-white pl-14 pr-6 py-5 rounded-2xl focus:border-primary/50 outline-none transition-all placeholder:text-gray-700 font-mono tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#2ae088] text-primary-dark font-black py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(46,204,127,0.2)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-10"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-sm">INICIAR SESIÓN</span>
                  <ArrowRightCircle size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      
      <footer className="relative z-10 p-8 text-center">
         <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">VibeRoute Colombia v1.0 • Sistema Seguro</p>
      </footer>
    </div>
  );
};
