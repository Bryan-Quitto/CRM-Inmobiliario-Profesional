import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';

interface CalendarioHeaderProps {
  calendarRef: React.RefObject<FullCalendar | null>;
  currentTitle: string;
  viewType: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  changeView: (type: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void;
  onOpenCrear: () => void;
}

export const CalendarioHeader: React.FC<CalendarioHeaderProps> = ({
  calendarRef,
  currentTitle,
  viewType,
  isFullScreen,
  toggleFullScreen,
  changeView,
  onOpenCrear
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight contactoing-none">Calendario</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Agenda</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-slate-500 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-3 py-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-xs font-bold transition-all text-slate-500 cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-slate-500 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="text-sm font-black text-slate-700 capitalize min-w-[150px]">
            {currentTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['dayGridMonth', 'timeGridWeek', 'timeGridDay'] as const).map((type) => (
            <button
              key={type}
              onClick={() => changeView(type)}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === type 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'dayGridMonth' ? 'Mes' : type === 'timeGridWeek' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>

        <button
          onClick={toggleFullScreen}
          className="p-2 bg-slate-100 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-90 cursor-pointer"
        >
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        <div className="h-8 w-px bg-slate-100 mx-1"></div>

        <button
          onClick={onOpenCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-100 active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          <span>Nuevo Evento</span>
        </button>
      </div>
    </header>
  );
};
