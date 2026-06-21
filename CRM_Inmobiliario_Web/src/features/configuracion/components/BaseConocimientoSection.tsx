import React, { useState, useRef, useCallback } from 'react';
import { BookOpen, UploadCloud, FileText, Loader2, CheckCircle2, ShieldAlert, Globe, X, Database, Building2 } from 'lucide-react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { Agency } from '../api/agencias';

export const BaseConocimientoSection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audience, setAudience] = useState<'Public' | 'Internal'>('Internal');
  const [agenciaId, setAgenciaId] = useState<string>('global');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: agencias } = useSWR<Agency[]>('/configuracion/agencias', (url: string) => api.get(url).then(res => res.data));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.md')) {
      toast.warning('Formato no soportado', { description: 'Solo se permiten archivos Markdown (.md)' });
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('audience', audience);
    if (agenciaId !== 'global') {
      formData.append('agenciaId', agenciaId);
    }

    try {
      await api.post('/corporate-knowledge/ingest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documento Ingestado', { 
        description: `El archivo ${file.name} ha sido procesado e integrado a la Base de Conocimiento.` 
      });
      clearFile();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } | string } };
      const data = axiosError.response?.data;
      const msg = (typeof data === 'string' ? data : data?.message) || 'Error al ingestar el documento';
      toast.error('Ocurrió un error', { description: msg });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="space-y-6 bg-violet-50/30 p-8 rounded-[40px] border border-violet-100/60 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
          <BookOpen size={20} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Base de Conocimiento IA</h2>
      </div>

      <div className="max-w-4xl">
        <p className="text-slate-600 font-medium mb-8">
          Alimenta el sistema RAG (Retrieval-Augmented Generation) con documentos Markdown (.md). 
          Define si el conocimiento es para respuestas del bot a prospectos o para uso interno de los agentes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Columna Izquierda: Audiencia */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Público Objetivo</h3>
            
            <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
              audience === 'Internal' 
                ? 'bg-violet-50 border-violet-500 shadow-sm shadow-violet-200' 
                : 'bg-white border-slate-200 hover:border-violet-300 hover:bg-slate-50'
            }`}>
              <input 
                type="radio" 
                name="audience" 
                value="Internal" 
                checked={audience === 'Internal'} 
                onChange={() => setAudience('Internal')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className={audience === 'Internal' ? 'text-violet-600' : 'text-slate-400'} />
                  <span className={`font-bold ${audience === 'Internal' ? 'text-violet-700' : 'text-slate-600'}`}>Uso Interno</span>
                </div>
                {audience === 'Internal' && <CheckCircle2 size={18} className="text-violet-600" />}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Documentos visibles únicamente por los agentes. Políticas, procesos y manuales.
              </p>
            </label>

            <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
              audience === 'Public' 
                ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-200' 
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}>
              <input 
                type="radio" 
                name="audience" 
                value="Public" 
                checked={audience === 'Public'} 
                onChange={() => setAudience('Public')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={18} className={audience === 'Public' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className={`font-bold ${audience === 'Public' ? 'text-emerald-700' : 'text-slate-600'}`}>Público</span>
                </div>
                {audience === 'Public' && <CheckCircle2 size={18} className="text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Conocimiento accesible por el Bot de WhatsApp para responder dudas a los prospectos.
              </p>
            </label>

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 mt-4">Alcance del Documento</h3>
            
            <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
              agenciaId === 'global' 
                ? 'bg-blue-50 border-blue-500 shadow-sm shadow-blue-200' 
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}>
              <input 
                type="radio" 
                name="scope" 
                value="global" 
                checked={agenciaId === 'global'} 
                onChange={() => setAgenciaId('global')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={18} className={agenciaId === 'global' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`font-bold ${agenciaId === 'global' ? 'text-blue-700' : 'text-slate-600'}`}>Global</span>
                </div>
                {agenciaId === 'global' && <CheckCircle2 size={18} className="text-blue-600" />}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Disponible para TODAS las agencias y agentes independientes.
              </p>
            </label>

            <label className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
              agenciaId !== 'global' 
                ? 'bg-indigo-50 border-indigo-500 shadow-sm shadow-indigo-200' 
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                  if (agenciaId === 'global' && agencias && agencias.length > 0) {
                    setAgenciaId(agencias[0].id);
                  }
                }}>
                  <Building2 size={18} className={agenciaId !== 'global' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`font-bold ${agenciaId !== 'global' ? 'text-indigo-700' : 'text-slate-600'}`}>Agencia Específica</span>
                </div>
                {agenciaId !== 'global' && <CheckCircle2 size={18} className="text-indigo-600" />}
              </div>
              <select 
                value={agenciaId === 'global' ? '' : agenciaId}
                onChange={(e) => {
                  if (e.target.value) setAgenciaId(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`mt-2 block w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-opacity ${agenciaId === 'global' ? 'opacity-60 cursor-pointer' : 'opacity-100'}`}
              >
                <option value="" disabled>Selecciona una agencia...</option>
                {agencias?.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Columna Derecha: Drag & Drop y Subida */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Documento Markdown</h3>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 min-h-[220px] ${
                file 
                  ? 'bg-white border-violet-200'
                  : isDragging
                    ? 'bg-violet-50 border-violet-400 scale-[1.02]'
                    : 'bg-slate-50 border-slate-300 hover:bg-violet-50/50 hover:border-violet-300 cursor-pointer'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".md"
                className="hidden" 
              />

              {!file ? (
                <>
                  <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isDragging ? 'bg-violet-200 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
                    <UploadCloud size={32} />
                  </div>
                  <h4 className="text-lg font-black text-slate-700 mb-1">Arrastra tu archivo aquí</h4>
                  <p className="text-sm text-slate-500 font-medium text-center">
                    o haz clic para explorar. <br/>Solo se admiten archivos <span className="font-bold text-violet-600">.md</span>
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center w-full animate-in zoom-in-95 duration-300">
                  <div className="p-4 bg-violet-100 text-violet-600 rounded-2xl mb-4 relative">
                    <FileText size={32} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 hover:scale-110 transition-all cursor-pointer shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 text-center truncate max-w-full px-4">{file.name}</h4>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`mt-2 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-sm cursor-pointer
                ${!file
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isUploading
                    ? 'bg-violet-600 text-white opacity-80 cursor-wait'
                    : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Ingestando Documento...
                </>
              ) : (
                <>
                  <Database size={20} />
                  Ingestar a Base de Conocimiento
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
