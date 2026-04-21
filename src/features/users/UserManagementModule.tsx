import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, User as UserIcon, Mail, Phone, Lock, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../shared/lib/api';
import { useAuthStore } from '../../app/store/authStore';

export const UserManagementModule: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: currentUser?.role === 'LOGISTICS' ? 'DRIVER' : 'LOGISTICS',
    costPerHour: 15000,
    assignedCity: currentUser?.role === 'LOGISTICS' ? currentUser.assignedCity : 'Bogotá'
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isLogistics = currentUser?.role === 'LOGISTICS';
  const canCreateAdmins = isSuperAdmin; // Solo Super Admin puede crear Admins
  const canCreateManagers = isSuperAdmin || isAdmin; // Admin puede crear Logística

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    // Validación básica en frontend
    if (formData.password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      setIsLoading(false);
      return;
    }

    try {
      // Codificamos la contraseña en Base64 para el transporte seguro
      const payload = {
        ...formData,
        password: btoa(formData.password)
      };

      await api.post('/auth/register', payload);
      
      setStatus({ 
        type: 'success', 
        message: `¡Usuario ${formData.name} registrado con éxito como ${formData.role}!` 
      });
      
      // Limpiar formulario (excepto ciudad y rol si es logística)
      setFormData({
        ...formData,
        email: '',
        password: '',
        name: '',
        phone: '',
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al registrar usuario. Verifica los datos.';
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Gestión de <span className="text-teal-600">Personal</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {isLogistics 
              ? `Registra nuevos repartidores para la ciudad de ${currentUser.assignedCity}` 
              : 'Administración global de perfiles administrativos y operativos'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100">
          <Shield size={20} className="text-teal-600" />
          <div>
            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">Nivel de Acceso</p>
            <p className="text-xs font-bold text-teal-900 uppercase italic">{currentUser?.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Formulario de Registro */}
        <div className="lg:col-span-2 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-teal-600">
              <UserPlus size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Nuevo Perfil</h3>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Corporativo</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="usuario@viberoute.com"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+57 300..."
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña (Min. 8 car)</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-bold"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol en la Organización</label>
                <select
                  disabled={isLogistics}
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData, 
                      role: newRole,
                      assignedCity: (newRole === 'ADMIN' || newRole === 'SUPER_ADMIN') ? 'Global' : formData.assignedCity
                    });
                  }}
                  className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl outline-none focus:border-teal-500 transition-all text-sm font-black uppercase tracking-widest disabled:opacity-50"
                >
                  <option value="DRIVER">Repartidor (DRIVER)</option>
                  {canCreateManagers && <option value="LOGISTICS">Operador Logístico</option>}
                  {canCreateAdmins && <option value="ADMIN">Administrador Regional</option>}
                  {isSuperAdmin && <option value="SUPER_ADMIN">Arquitecto (SUPER_ADMIN)</option>}
                </select>
              </div>

              {(formData.role === 'DRIVER' || formData.role === 'LOGISTICS') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad Asignada</label>
                  <input
                      type="text"
                      disabled={isLogistics}
                      value={formData.assignedCity}
                      onChange={(e) => setFormData({...formData, assignedCity: e.target.value})}
                      placeholder="Ej: Medellín"
                      className="w-full bg-white border border-slate-200 px-6 py-4 rounded-2xl outline-none focus:border-teal-500 transition-all text-sm font-bold disabled:opacity-50"
                    />
                </div>
              )}
            </div>

            {formData.role === 'DRIVER' && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mt-4">
                <div className="flex items-center gap-3 mb-2">
                   <AlertCircle className="text-amber-600" size={18} />
                   <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Detalles de Operación</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Costo por Hora (COP)</label>
                  <input
                    type="number"
                    value={formData.costPerHour}
                    onChange={(e) => setFormData({...formData, costPerHour: Number(e.target.value)})}
                    className="w-full bg-white border border-amber-200 px-6 py-3 rounded-xl outline-none focus:border-amber-500 text-sm font-bold"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="uppercase text-xs tracking-[0.2em]">Guardar Nuevo Perfil</span>
                    <Save size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Estado y Feedback */}
        <div className="space-y-6">
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-8 rounded-[2rem] border ${
                  status.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                } shadow-sm relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${
                    status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">
                    {status.type === 'success' ? 'Éxito' : 'Error'}
                  </h4>
                  <p className="text-sm font-medium leading-relaxed">
                    {status.message}
                  </p>
                </div>
                {/* Decoración de fondo */}
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${
                  status.type === 'success' ? 'bg-emerald-900' : 'bg-rose-900'
                }`} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Instrucciones</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center text-[10px] font-bold text-teal-700 mt-1">1</div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Los correos deben ser únicos en toda la plataforma.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center text-[10px] font-bold text-teal-700 mt-1">2</div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Solo los Administradores pueden otorgar permisos para gestionar otras ciudades.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center text-[10px] font-bold text-teal-700 mt-1">3</div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Una vez creado, el usuario puede loguearse inmediatamente con su email y la contraseña asignada.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
