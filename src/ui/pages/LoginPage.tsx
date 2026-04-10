import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Package, Bike, ArrowRight, Clock, Globe } from 'lucide-react';
import hubBg from '../../shared/assets/hub-bg.png';
import logo from '../../shared/assets/viberoute-logo.png';
import { cn } from '../../shared/lib/utils';

const PORTALS = [
  {
    id: 'admin',
    title: 'Centro de Control',
    subtitle: 'NIVEL: SEGURIDAD ESTRATÉGICA',
    role: 'Administrador',
    icon: Shield,
    color: 'from-blue-600 to-indigo-700',
    path: '/login/admin',
    badge: 'ID: ADMIN_ACS'
  },
  {
    id: 'logistics',
    title: 'Gestión Operativa',
    subtitle: 'NIVEL: SUMINISTRO & CARGA',
    role: 'Logística',
    icon: Package,
    color: 'from-emerald-600 to-teal-700',
    path: '/login/logistics',
    badge: 'ID: LOGISTICS_ACS'
  },
  {
    id: 'driver',
    title: 'Entrega en Ruta',
    subtitle: 'NIVEL: OPERACIÓN DE CAMPO',
    role: 'Repartidor',
    icon: Bike,
    color: 'from-orange-600 to-red-700',
    path: '/login/driver',
    badge: 'ID: DRIVER_ACS'
  }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden font-sans relative selection:bg-primary/30">
      {/* Background Cinematic layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 transform scale-110 motion-safe:animate-[pulse_10s_ease-in-out_infinite]"
        style={{ backgroundImage: `url(${hubBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/80 to-transparent" />

      {/* Header Info (Premium feel) */}
      <header className="relative z-20 flex justify-between items-center p-8">
        <div className="flex items-center gap-4">
          <img 
            src={logo} 
            alt="VibeRoute Logo" 
            className="w-12 h-12 rounded-xl shadow-lg shadow-primary/30 transform hover:rotate-12 transition-transform cursor-pointer"
          />
          <div>
            <span className="text-xl font-black tracking-tighter block leading-none">VibeRoute</span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-primary/70 font-bold">Operaciones Colombia</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-primary" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Globe size={12} className="text-primary" />
            <span>Red Nacional - 001</span>
          </div>
          <div className="px-3 py-1 border border-white/10 rounded-full bg-white/5">
            Plataforma v1.0
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-20">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-6"
          >
             Centro Digital de Suministros
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
          >
            Bienvenido al <span className="text-white italic">Futuro.</span>
          </motion.h1>
          <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Selecciona tu interfaz operativa para iniciar la sincronización <br/> de la flota en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {PORTALS.map((portal, idx) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(portal.path)}
              className="group cursor-pointer relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] transform group-hover:scale-[1.02] transition-transform duration-500" />
              
              <div className="relative p-10 h-full border border-white/5 bg-[#0a0c14]/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group-hover:border-primary/30 transition-all duration-500">
                <div className="flex justify-between items-start mb-12">
                  <div className={cn("p-4 rounded-2xl bg-white/5 text-gray-400 group-hover:text-white transition-colors")}>
                    <portal.icon size={32} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-black text-white/20 group-hover:text-primary transition-colors tracking-widest uppercase">
                    {portal.badge}
                  </span>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">
                    {portal.subtitle}
                  </span>
                  <h2 className="text-4xl font-black tracking-tighter text-white">
                    {portal.title}
                  </h2>
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest group-hover:text-gray-300 transition-colors">
                    {portal.role}
                  </p>
                </div>

                <div className="mt-12 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  Acceder al Sistema <ArrowRight size={14} />
                </div>

                {/* Decorative Blobs */}
                <div className={cn("absolute -bottom-12 -right-12 w-32 h-32 blur-[80px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity bg-primary")} />
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 p-12 text-center">
        <div className="w-16 h-[2px] bg-primary/20 mx-auto mb-6" />
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.5em]">
          VibeRoute Global Systems © 2026 • Bogota Node
        </p>
      </footer>
    </div>
  );
};
