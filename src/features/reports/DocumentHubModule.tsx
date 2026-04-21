import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Search, 
  Clock, 
  User,
  CheckCircle2,
  Loader2,
  FilePlus,
  RefreshCcw,
  BarChart4
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { useAuthStore } from '../../app/store/authStore';
import { generateDailyReportPdf } from '../../shared/lib/pdfGenerator';

interface Document {
  id: string;
  filename: string;
  sender: string;
  type: string;
  timestamp: string;
}

export const DocumentHubModule: React.FC<{ mode: 'admin' | 'logistica' }> = ({ mode }) => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', user?.name || 'Operador Logística');
    formData.append('type', 'MANIFIESTO_PDF');

    try {
      await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      fetchDocs();
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      alert("Error al subir el documento.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async () => {
    setUploading(true);
    try {
      // 1. Obtener la data más reciente desde el backend
      const [{ data: stats }, { data: ranking }, { data: financials }] = await Promise.all([
        api.get('/stats/delivery-summary'),
        api.get('/stats/driver-ranking'),
        api.get('/stats/financial-summary')
      ]);

      // 2. Generar el PDF en el cliente como un Blob
      const pdfBlob = generateDailyReportPdf(stats, financials, ranking);

      // 3. Crear el archivo y enviarlo por la red
      const file = new File([pdfBlob], `Cierre_Operativo_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sender', 'Sistema Automático');
      formData.append('type', 'CIERRE_OPERATIVO');

      await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus('success');
      fetchDocs();
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error("Error generando reporte:", err);
      alert("Error al generar y enviar el reporte automático.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
             Hub de <span className="text-teal-600">Documentación</span>
           </h2>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Intercambio de Reportes y Manifiestos</p>
        </div>

        {mode === 'logistica' ? (
           <div className="flex gap-4">
              <label className="flex items-center gap-3 px-6 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                 <UploadCloud size={18} /> Subir Reporte
                 <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
           </div>
        ) : (
           <div className="flex gap-4">
              <button 
                 onClick={handleGenerateReport}
                 disabled={uploading}
                 className="flex items-center gap-3 px-6 py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 disabled:opacity-50 active:scale-95"
              >
                 {uploading ? <Loader2 size={18} className="animate-spin" /> : <BarChart4 size={18} />}
                 {uploading ? 'Procesando...' : 'Generar Cierre Global'}
              </button>
           </div>
        )}
      </div>

      {status === 'success' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs font-black uppercase">
           <CheckCircle2 size={18} /> Documento enviado correctamente a la central
        </motion.div>
      )}

      {/* Main List Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Nombre del Archivo</span>
            <div className="flex gap-20">
               <span className="w-32">Emisor</span>
               <span className="w-24 text-right">Acción</span>
            </div>
         </div>

         <div className="divide-y divide-slate-50">
            {loading ? (
               <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                  <Loader2 size={40} className="animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Archivos...</p>
               </div>
            ) : documents.length === 0 ? (
               <div className="p-20 flex flex-col items-center justify-center gap-6 text-slate-200">
                  <FilePlus size={64} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay documentos compartidos aún</p>
               </div>
            ) : (
               documents
                .filter(doc => {
                  if (mode === 'admin') return true;
                  // Si es logística, ver sus propios reportes o los del sistema/admin
                  const isOwn = doc.sender === user?.name;
                  const isGlobal = doc.sender === 'Sistema Automático' || doc.sender === 'Admin Central';
                  return isOwn || isGlobal;
                })
                .map((doc) => (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    key={doc.id} 
                    className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
                           <FileText size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800 tracking-tight">{doc.filename}</p>
                           <p className="text-[9px] font-bold text-slate-400 flex items-center gap-2 mt-1 uppercase">
                              <Clock size={10} /> {doc.timestamp}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-20">
                        <div className="w-32 flex items-center gap-3">
                           <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                              <User size={14} />
                           </div>
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate">{doc.sender}</p>
                        </div>
                        <button 
                           onClick={() => {
                             api.get(`/reports/download/${doc.id}`, { responseType: 'blob' })
                               .then(response => {
                                 const url = window.URL.createObjectURL(new Blob([response.data]));
                                 const link = document.createElement('a');
                                 link.href = url;
                                 link.setAttribute('download', doc.filename);
                                 document.body.appendChild(link);
                                 link.click();
                                 link.remove();
                               })
                               .catch(err => console.error("Error descargando:", err));
                           }}
                           className="w-24 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-lg active:scale-95"
                        >
                           <Download size={16} />
                        </button>
                     </div>
                  </motion.div>
               ))
            )}
         </div>
      </div>

    </div>
  );
};
