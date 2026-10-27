import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('NIRA ErrorBoundary caught an unhandled exception:', error, errorInfo);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance('NIRA encountered a temporary issue. Tap the screen to restart.');
        msg.rate = 0.95;
        window.speechSynthesis.speak(msg);
      }
    } catch {}
  }

  private handleRestart = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#FAF7F2] text-[#1F1424] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#FA5238]/10 text-[#FA5238] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl font-black text-[#2D1236] mb-2 font-display">
            NIRA Recovery
          </h1>

          <p className="text-sm text-[#5B4F63] max-w-sm mb-6 leading-relaxed">
            The application intercepted an unexpected issue and remained open safely. Tap below to reload the currency scanner.
          </p>

          <button
            onClick={this.handleRestart}
            className="touch-target px-6 py-4 rounded-2xl bg-[#2D1236] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-[#441B52] active:scale-95 transition-all"
            aria-label="Restart NIRA Application"
          >
            <RotateCcw className="w-5 h-5 text-[#FA5238]" />
            <span>Restart Currency Scanner</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
