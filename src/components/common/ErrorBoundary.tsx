import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LibreDroid ErrorBoundary caught exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-900 text-white text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30 shadow-lg">
            <AlertTriangle size={30} />
          </div>
          <h2 className="text-base font-bold text-white">{this.props.fallbackTitle || 'Application'} Recovered</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm font-mono px-4 py-2 bg-neutral-950 rounded-xl border border-neutral-800">
            {this.state.error?.message || 'Component failed to render safely'}
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95"
            >
              <RotateCcw size={14} />
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
