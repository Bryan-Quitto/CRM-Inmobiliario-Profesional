import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePerfil } from '@/features/auth/api/perfil';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { perfil, isLoading } = usePerfil();
  const ADMIN_ID = 'd4a6efdd-b801-40fb-901e-64e36f6b1400';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (perfil?.id !== ADMIN_ID) {
    return <Navigate to="/" replace state={{ authError: 'Esta sección es exclusiva para administradores.' }} />;
  }

  return <>{children}</>;
};

export default AdminRoute;
