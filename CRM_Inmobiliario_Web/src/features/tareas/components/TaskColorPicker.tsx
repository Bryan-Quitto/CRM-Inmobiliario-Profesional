import React from 'react';

import { COLORS } from '../constants/taskColors';

interface TaskColorPickerProps {
  value?: string | null;
  onChange: (hex: string | null) => void;
  error?: string;
}

export const TaskColorPicker: React.FC<TaskColorPickerProps> = ({ value, onChange, error }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COLORS.map(color => {
          const isSelected = value === color.hex;
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onChange(isSelected ? null : color.hex)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={color.name}
            >
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[10px] text-rose-500 font-bold uppercase pl-1">{error}</p>}
    </div>
  );
};
