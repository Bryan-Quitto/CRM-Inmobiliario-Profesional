import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

interface ContactCardPreviewProps {
  id: string;
  name: string;
}

export const ContactCardPreview: React.FC<ContactCardPreviewProps> = ({ id, name }) => {
  return (
    <Link 
      to={`/contactos/${id}`}
      className="mt-3 mb-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center gap-3 no-underline"
    >
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
        <User className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{name}</h4>
        <p className="text-xs text-blue-600 font-medium mt-0.5">Ver perfil del contacto &rarr;</p>
      </div>
    </Link>
  );
};
