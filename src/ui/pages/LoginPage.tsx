import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ShieldCheck, AlertCircle, Phone } from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import api from '../../shared/lib/api';


interface VibeRouteLogoProps {
  className?: string;
  glowColor?: string;
}

const VibeRouteLogo: React.FC<VibeRouteLogoProps> = ({ className = "w-full h-full" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Fondo de Red */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
        <pattern id="gridDots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#4ade80" />
        </pattern>
        <rect width="100" height="100" fill="url(#gridDots)" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        // Importante: overflow-visible evita recortes en trazos gruesos
        className="w-full h-full relative z-10 overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="vibeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Guía base (Ghost path) para que nunca se vea "vacío" si falla la animación */}
        <path
          d="M20 45 L50 80 L85 25"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20"
        />

        {/* Trazo Animado - Cambiado a 'animate' para asegurar ejecución en móviles */}
        <motion.path
          d="M20 45 L50 80 L85 25"
          stroke="url(#vibeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
            delay: 0.2
          }}
        />

        {/* Nodos tácticos */}
        <motion.circle
          cx="20" cy="45" r="6"
          fill="#0f172a"
          stroke="#4ade80"
          strokeWidth="3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        />

        <g>
          <circle
            cx="85" cy="25" r="12"
            className="fill-green-400/20 animate-ping"
          />
          <motion.circle
            cx="85" cy="25" r="7"
            fill="url(#vibeGrad)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.1, type: "spring" }}
          />
        </g>
      </svg>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    setIsLoading(true);

    if (isResetMode) {
      try {
        await api.post('/auth/reset-password', {
          email: email.toLowerCase(),
          phone,
          newPassword: btoa(newPassword)
        });
        setIsSuccess(true);
        setError('Solicitud enviada. Un administrador debe aprobar el cambio antes de que puedas usar tu nueva clave.');
        // Limpiar campos de reset
        setPhone('');
        setNewPassword('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al solicitar el cambio. Verifica los datos.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const encodedPassword = btoa(password);
      const { data } = await api.post('/auth/login', { email: email.toLowerCase(), password: encodedPassword });

      const { token, user } = data;
      const tokenRole = user.role.replace('ROLE_', '');

      setAuth(token, tokenRole, email, user.name, user.assignedCity);
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.response?.status === 404) {
        setError('No se pudo contactar con el servidor (Error 404).');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans p-4 relative overflow-hidden select-none">

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-green-500/20 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-emerald-600/20 to-transparent blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1000px] bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 border border-slate-700/50"
      >
        {/* Banner Lateral */}
        <div className="hidden lg:flex lg:w-5/12 bg-slate-800/50 p-12 flex-col justify-between relative border-r border-slate-700/50">
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-slate-900/80 rounded-2xl flex items-center justify-center mb-8 shadow-lg border border-slate-800"
            >
              <VibeRouteLogo className="w-20 h-20" />
            </motion.div>

            <h2 className="text-white text-4xl font-black tracking-tight leading-tight mb-4">
              VibeRoute <br /><span className="text-green-400">Colombia</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
              Plataforma de inteligencia logística nacional. Sincronización en tiempo real para operadores autorizados.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck size={16} /> Encriptación Militar
              </div>
              <p className="text-xs text-slate-400">
                Tu sesión está protegida mediante algoritmos avanzados y tokens JWT rotativos.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Login */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-slate-800/30">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-slate-900/80 rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-slate-800">
              <VibeRouteLogo className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">VibeRoute <span className="text-green-400">Colombia</span></h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              {isResetMode ? 'Recuperar' : 'Acceso'} <span className="text-green-400">{isResetMode ? 'Acceso' : 'Operativo'}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {isResetMode
                ? 'Ingresa tu correo para recibir un enlace de restablecimiento.'
                : 'Ingresa tus credenciales para acceder al panel central.'}
            </p>
          </div>
          <AnimatePresence>
            {(error || isSuccess) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className={`p-4 border rounded-2xl flex items-center gap-3 ${isSuccess ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                  }`}>
                  <AlertCircle className={isSuccess ? 'text-green-400 shrink-0' : 'text-red-400 shrink-0'} size={20} />
                  <p className={`text-sm font-medium ${isSuccess ? 'text-green-200' : 'text-red-200'}`}>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Identificación / Correo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-6 py-4 rounded-2xl focus:bg-slate-900 focus:border-green-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                  placeholder="admin@viberoute.com"
                  required
                />
              </div>
            </div>

            {isResetMode && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono de Validación</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-6 py-4 rounded-2xl focus:bg-slate-900 focus:border-green-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                      placeholder="Tu número registrado"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nueva Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={20} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-6 py-4 rounded-2xl focus:bg-slate-900 focus:border-green-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {!isResetMode && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-6 py-4 rounded-2xl focus:bg-slate-900 focus:border-green-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsResetMode(!isResetMode)}
                className="text-xs font-bold text-green-400 hover:text-green-300 transition-colors uppercase tracking-widest px-1"
              >
                {isResetMode ? 'Volver al ingreso' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase text-sm tracking-widest">
                    {isResetMode ? 'Enviar Instrucciones' : 'Verificar Identidad'}
                  </span>
                  {isResetMode ? <Mail size={20} /> : <LogIn size={20} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-4 text-center">
            <div className="h-px flex-1 bg-slate-700/50" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2">VibeRoute Systems © 2026</span>
            <div className="h-px flex-1 bg-slate-700/50" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};