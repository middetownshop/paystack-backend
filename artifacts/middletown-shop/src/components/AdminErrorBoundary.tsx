import { Component, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[AdminPanel error]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
          <ShieldAlert className="h-12 w-12 text-destructive opacity-60" />
          <div>
            <p className="text-lg font-bold text-destructive">Admin Panel encountered an error</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
