import React, { useState } from 'react';
import useSWR from 'swr';
import { Building2, Plus, Loader2, Pencil, Search } from 'lucide-react';
import { api } from '../../../lib/axios';
import { crearAgencia, actualizarAgencia, type Agency, type AgencyData } from '../api/agencias';
import { toast } from 'sonner';
import { PhoneInputWorldClass } from '@/features/contactos/components/PhoneInputWorldClass';

export const ConfiguracionAgencias: React.FC = () => {
  const { data: agencias, isLoading, mutate } = useSWR<Agency[]>('/configuracion/agencias', (url: string) => api.get(url).then(res => res.data));
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AgencyData>({
    nombre: '',
    telefonoCorporativo: '',
    emailCorporativo: '',
    direccionFisica: '',
    sitioWeb: '',
    contextoCorporativoIA: ''
  });

  const handleOpenCreate = () => {
    setEditingAgency(null);
    setFormData({ nombre: '', telefonoCorporativo: '', emailCorporativo: '', direccionFisica: '', sitioWeb: '', contextoCorporativoIA: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      nombre: agency.nombre,
      telefonoCorporativo: agency.telefonoCorporativo || '',
      emailCorporativo: agency.emailCorporativo || '',
      direccionFisica: agency.direccionFisica || '',
      sitioWeb: agency.sitioWeb || '',
      contextoCorporativoIA: agency.contextoCorporativoIA || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingAgency) {
        await actualizarAgencia(editingAgency.id, formData);
        toast.success('Agencia actualizada', { description: `La agencia "${formData.nombre}" ha sido modificada.` });
      } else {
        await crearAgencia(formData);
        toast.success('Agencia creada', { description: `La agencia "${formData.nombre}" ha sido registrada.` });
      }
      setIsModalOpen(false);
      mutate();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      const msg = axiosError.response?.data || 'Error al guardar la agencia';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgencias = agencias?.filter(a => a.nombre.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="text-indigo-600" />
            Directorio de Agencias
          </h2>
          <p className="text-slate-500 font-medium">Gestiona la información corporativa y el contexto para IA de tus agencias.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Nueva Agencia
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar agencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredAgencias.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No se encontraron agencias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgencias.map((agencia) => (
              <div key={agencia.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">{agencia.nombre}</h3>
                  {agencia.telefonoCorporativo && <p className="text-xs text-slate-500 font-medium mb-1"><strong className="text-slate-700">Tel:</strong> {agencia.telefonoCorporativo}</p>}
                  {agencia.emailCorporativo && <p className="text-xs text-slate-500 font-medium mb-1"><strong className="text-slate-700">Email:</strong> {agencia.emailCorporativo}</p>}
                  {agencia.contextoCorporativoIA && (
                    <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Contexto IA Activo</p>
                      <p className="text-xs text-slate-600 line-clamp-2 italic">{agencia.contextoCorporativoIA}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenEdit(agencia)}
                  className="mt-4 w-full bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer"
                >
                  <Pencil size={14} />
                  Editar Perfil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  {editingAgency ? <Pencil size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {editingAgency ? 'Editar Agencia' : 'Nueva Agencia'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {editingAgency ? 'Modifica los datos corporativos de la agencia.' : 'Ingresa la información para registrar una nueva agencia.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Nombre Comercial <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="Ej. RE/MAX Diamante"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Teléfono Corporativo</label>
                    <PhoneInputWorldClass
                      value={formData.telefonoCorporativo || ''}
                      onChange={(phone) => setFormData({ ...formData, telefonoCorporativo: phone })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Email Corporativo</label>
                    <input
                      type="email"
                      value={formData.emailCorporativo || ''}
                      onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="contacto@agencia.com"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Dirección Física</label>
                    <input
                      type="text"
                      value={formData.direccionFisica || ''}
                      onChange={(e) => setFormData({ ...formData, direccionFisica: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="Dirección completa de la oficina..."
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Sitio Web</label>
                    <input
                      type="url"
                      value={formData.sitioWeb || ''}
                      onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="https://www.agencia.com"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-indigo-600 mb-2 flex justify-between items-center">
                      <span>Contexto Corporativo (Prompt para IA)</span>
                      <span className="text-[10px] font-medium normal-case text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Altamente recomendado</span>
                    </label>
                    <textarea
                      value={formData.contextoCorporativoIA || ''}
                      onChange={(e) => setFormData({ ...formData, contextoCorporativoIA: e.target.value })}
                      className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium min-h-[120px] resize-y"
                      placeholder="Ej. Somos una agencia especializada en propiedades comerciales de lujo en Quito. Nuestro trato es extremadamente formal. Operamos de Lunes a Sábado de 9h00 a 18h00. Solo trabajamos con exclusividad."
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Este texto será inyectado silenciosamente a la IA de todos los agentes de esta agencia, dándole contexto sobre cómo comportarse y qué directrices seguir en WhatsApp y Facebook.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.nombre.trim()}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                    {editingAgency ? 'Guardar Cambios' : 'Crear Agencia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ConfiguracionAgencias;
