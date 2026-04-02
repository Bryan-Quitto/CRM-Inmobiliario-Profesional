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
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aquí podrías enviar el error a un servicio de logging (Sentry, LogRocket, etc.)
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Detectamos si es un error de red al cargar un componente Lazy
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                          this.state.error?.message.includes('Loading chunk') ||
                          this.state.error?.message.includes('Dynamic import');

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
