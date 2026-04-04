import React, { useState, useEffect } from 'react';
import { usePerfil } from '../api/perfil';
import { User, Phone, Building, Mail, Save, CheckCircle } from 'lucide-react';
import FotoPerfilUpload from './FotoPerfilUpload';

const ConfiguracionPerfil: React.FC = () => {
  const { perfil, isLoading, actualizarPerfil } = usePerfil();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    agencia: '',
    fotoUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sincronizar datos del servidor con el formulario local
  useEffect(() => {
    if (perfil) {
      setFormData({
        nombre: perfil.nombre ?? '',
        apellido: perfil.apellido ?? '',
        telefono: perfil.telefono ?? '',
        agencia: perfil.agencia ?? '',
        fotoUrl: perfil.fotoUrl ?? ''
      });
    }
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await actualizarPerfil(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !perfil) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Perfil</h1>
        <p className="text-gray-600">Actualiza tus datos para las fichas técnicas y contacto.</p>
      </header>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección de Foto de Perfil */}
            <div className="flex flex-col md:flex-row items-center gap-12 pb-8 border-b border-gray-100">
              <FotoPerfilUpload 
                userId={perfil?.id || ''} 
                currentFotoUrl={formData.fotoUrl}
                onUploadSuccess={async (url) => {
                  const nuevosDatos = { ...formData, fotoUrl: url };
                  setFormData(nuevosDatos);
                  // Sincronización inmediata con DB para evitar inconsistencia Bucket-DB
                  await actualizarPerfil(nuevosDatos);
                }}
                onDeleteSuccess={async () => {
                  const nuevosDatos = { ...formData, fotoUrl: '' };
                  setFormData(nuevosDatos);
                  // Sincronización inmediata con DB
                  await actualizarPerfil(nuevosDatos);
                }}
              />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-gray-900">Tu Foto de Perfil</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Esta foto se usará en tus fichas técnicas en PDF y en la barra lateral del CRM. Se recomienda una foto profesional de frente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={18} className="text-indigo-500" /> Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={18} className="text-indigo-500" /> Apellido
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Tu apellido"
                  required
                />
              </div>

              {/* Email (Solo lectura) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={18} className="text-gray-400" /> Email (No editable)
                </label>
                <input
                  type="email"
                  value={perfil?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={18} className="text-indigo-500" /> Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="+1 234 567 890"
                />
              </div>

              {/* Agencia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building size={18} className="text-indigo-500" /> Nombre de la Agencia / Empresa
                </label>
                <input
                  type="text"
                  value={formData.agencia}
                  onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: Inmobiliaria Horizonte Real"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showSuccess && (
                  <span className="text-green-600 flex items-center gap-2 font-medium animate-bounce">
                    <CheckCircle size={20} /> ¡Perfil actualizado con éxito!
                  </span>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSaving}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${
                  isSaving ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 cursor-pointer'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Vista Previa de Ficha */}
      <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-900 mb-2">Información para Fichas PDF</h3>
        <p className="text-sm text-indigo-700">
          Así aparecerán tus datos en el pie de página de las fichas técnicas que compartas:
        </p>
        <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden border border-indigo-200 shadow-sm">
            {formData.fotoUrl ? (
              <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase">{formData.nombre?.[0]}{formData.apellido?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900">{formData.nombre} {formData.apellido}</p>
            <p className="text-sm text-gray-500">{formData.agencia || 'Agente Independiente'}</p>
            <p className="text-sm text-indigo-600 font-medium">{formData.telefono || 'Sin teléfono configurado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPerfil;
