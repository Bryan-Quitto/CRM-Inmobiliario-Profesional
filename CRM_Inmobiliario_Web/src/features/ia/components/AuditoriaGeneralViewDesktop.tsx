import React, { useState } from 'react';
import { AuditoriaGeneralFiltros } from './AuditoriaGeneralFiltros';
import { Loader2, MessageSquare, ShieldAlert, User, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import type { AuditoriaGeneralLogic, AuditoriaSessionWithStats } from '../hooks/useAuditoriaGeneralViewLogic';


const SessionCard: React.FC<{ sesion: AuditoriaSessionWithStats }> = ({ sesion }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-start justify-between cursor-pointer hover:bg-slate-100 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg mt-1">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">
              {[sesion.contactoNombre, sesion.contactoApellido].filter(Boolean).join(' ') 
                ? `${[sesion.contactoNombre, sesion.contactoApellido].filter(Boolean).join(' ')} ${sesion.telefono ? `(${sesion.telefono})` : ''}`
                : (sesion.telefono || 'Desconocido')
              } 
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {format(new Date(sesion.inicioSesion), "d MMM, HH:mm", { locale: es })}
                {' - '}
                {format(new Date(sesion.finSesion), "HH:mm", { locale: es })}
              </span>
            </div>
            
            {!isOpen && (
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  IA: {sesion.totalIA} {sesion.totalIA === 1 ? 'acción/msj' : 'acciones/msjs'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  {sesion.canalPrincipal !== 'WhatsApp' && sesion.canalPrincipal !== 'Facebook' ? 'Agente' : 'Contacto'}: {sesion.totalContacto} {sesion.totalContacto === 1 ? 'mensaje' : 'mensajes'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-md">
              Sesión #{sesion.sessionId}
            </div>
            <div className={`p-1 rounded-md transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-200 text-slate-600' : 'bg-transparent text-slate-400'}`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex gap-2">
            {sesion.canalPrincipal === 'WhatsApp' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md">WhatsApp</span>
            )}
            {sesion.canalPrincipal === 'Facebook' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md">Facebook</span>
            )}
            {(sesion.canalPrincipal !== 'WhatsApp' && sesion.canalPrincipal !== 'Facebook') && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 rounded-md">Personal</span>
            )}
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-5 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
            {sesion.eventos.map((evento) => {
              const isAiAction = evento.source === 'AiAction';
              const icon = isAiAction ? <ShieldAlert className="w-4 h-4 text-orange-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />;
              const bgClass = isAiAction ? 'bg-orange-100 border-orange-200' : 'bg-blue-100 border-blue-200';
              
              const sourceMap: Record<string, string> = {
                'AiAction': 'Acción IA',
                'Facebook': 'Facebook Messenger',
                'WhatsApp': 'WhatsApp',
                'Copilot': 'Mensaje Personal'
              };
              
              const displaySource = sourceMap[evento.source] || evento.source;
              let displayAccion = evento.accion;
              
              let tareaId = null;
              let isMessage = false;
              let messageSender = '';
              let messageContent = '';

              if (isAiAction && evento.detalleJson) {
                try {
                  const parsed = JSON.parse(evento.detalleJson);
                  if (parsed.tareaId) tareaId = parsed.tareaId;
                  if (parsed.toolName) displayAccion = `Ejecución de Herramienta: ${parsed.toolName}`;
                  else if (parsed.intent) displayAccion = `Intención Detectada: ${parsed.intent}`;
                } catch {
                  if (evento.accion === 'Respuesta Generada') {
                    displayAccion = 'Evaluación de Intención y Herramientas';
                  }
                }
              } else if (!isAiAction && evento.detalleJson) {
                isMessage = true;
                const sender = evento.senderType?.toLowerCase() || '';
                const isAi = sender === 'ia' || sender === 'assistant';
                messageSender = isAi ? 'IA' : (sesion.canalPrincipal !== 'WhatsApp' && sesion.canalPrincipal !== 'Facebook' ? 'Agente' : 'Contacto');
                
                messageContent = evento.detalleJson.length > 200 
                  ? evento.detalleJson.substring(0, 200) + '...' 
                  : evento.detalleJson;
              }

              return (
                <div key={evento.eventId} className="relative pl-6">
                  <span className={`absolute -left-[11px] top-1 rounded-full border p-1 ${bgClass} bg-white`}>
                    {icon}
                  </span>
                  
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 w-0 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {displaySource}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(evento.fecha), "HH:mm:ss", { locale: es })}
                          </span>
                        </div>
                        
                        {isMessage ? (
                          <div className="mt-1 flex items-start gap-1.5 flex-col">
                            <span className={`text-xs font-bold ${messageSender === 'IA' ? 'text-blue-700' : 'text-slate-700'}`}>
                              {messageSender}:
                            </span>
                            <div className="text-sm text-slate-900 prose prose-sm max-w-none prose-p:leading-snug prose-slate break-words w-full overflow-hidden">
                              <ReactMarkdown>
                                {messageContent}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-900 font-medium break-words">{displayAccion}</p>
                        )}

                        {evento.triggerMessage && (
                          <p className="text-sm text-slate-600 mt-1 italic break-words border-l-2 border-slate-300 pl-2">
                            "{evento.triggerMessage}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isAiAction ? (
                          <Link
                            to={`?tarea=${tareaId || evento.eventId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors shadow-sm"
                          >
                            Ir a la Tarea
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            to={`/registros-sistema-ia/${evento.source === 'Copilot' ? 'personal' : evento.source.toLowerCase()}?${evento.source === 'Copilot' ? `convId=${sesion.telefono}` : `telefono=${sesion.telefono || ''}`}&msgId=${evento.eventId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors shadow-sm"
                          >
                            Ver Mensaje
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const AuditoriaGeneralViewDesktop: React.FC<{ logic: AuditoriaGeneralLogic }> = ({ logic }) => {
  const { sesiones, isLoading, error, dias, setDias, startDate, setStartDate, endDate, setEndDate, canal, setCanal, isByokExhausted } = logic;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Error al cargar los registros de auditoría general.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Auditoría General IA</h1>
        <p className="text-slate-500 mt-1">
          Visión unificada de sesiones y acciones de inteligencia artificial.
        </p>
      </div>

      {isByokExhausted && (
        <div className="mb-6 bg-amber-50 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-amber-900">
            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm font-medium">
              <strong>⚠️ Crédito BYOK agotado.</strong> La IA de WhatsApp, Facebook y Copilot han sido desactivadas.
            </p>
          </div>
          <Link
            to="/configuracion/integracion-ia"
            className="shrink-0 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg transition-colors border border-amber-500/20 whitespace-nowrap"
          >
            Configurar IA
          </Link>
        </div>
      )}

      <AuditoriaGeneralFiltros 
        dias={dias} 
        setDias={setDias} 
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        canal={canal} 
        setCanal={setCanal} 
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : sesiones.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No hay registros</h3>
          <p className="text-slate-500">No se encontraron sesiones en este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sesiones.map((sesion) => (
            <SessionCard key={`${sesion.sessionKey}-${sesion.sessionId}`} sesion={sesion} />
          ))}
        </div>
      )}
    </div>
  );
};
