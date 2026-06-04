import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';

interface PropertyCardPreviewProps {
  id: string;
  title: string;
}

export const PropertyCardPreview: React.FC<PropertyCardPreviewProps> = ({ id, title }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/propiedades/${id}`)}
      className="mt-3 mb-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
        <Building className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{title}</h4>
        <p className="text-xs text-indigo-600 font-medium mt-0.5">Ver ficha completa &rarr;</p>
      </div>
    </div>
  );
};
