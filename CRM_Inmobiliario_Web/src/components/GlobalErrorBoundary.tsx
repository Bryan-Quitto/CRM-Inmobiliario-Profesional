import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { OfflinePage } from './OfflinePage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detectar si es un error de chunk (Vite / Webpack)
    const isChunkError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('Unable to preload CSS') ||
      error?.message?.includes('Dynamic import');

    if (isChunkError) {
      // Estrategia anti-loop: solo recargamos UNA vez por sesión
      const alreadyReloaded = sessionStorage.getItem('crm_chunk_reload_attempted');
      if (!alreadyReloaded) {
        sessionStorage.setItem('crm_chunk_reload_attempted', '1');
        // Recarga limpia: fuerza al navegador a bajar los nuevos assets del deploy
        window.location.reload();
        // Retornamos el estado de error para el render antes de que recargue
        return { hasError: true, error };
      }
      // Si ya recargamos y sigue fallando → red real o problema de servidor
      sessionStorage.removeItem('crm_chunk_reload_attempted');
    }

    return { hasError: true, error };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Detectamos si es un error de red al cargar un componente Lazy (chunk stale o red inestable)
      const isChunkError = 
        this.state.error?.name === 'ChunkLoadError' || 
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed') ||
        this.state.error?.message?.includes('Dynamic import');

      return (
        <OfflinePage 
          type={isChunkError ? 'offline' : 'error'} 
          error={this.state.error || undefined}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
