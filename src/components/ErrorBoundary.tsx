import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            An unexpected error occurred. Try refreshing or navigating back.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
              <RefreshCw size={14} />
              Try Again
            </Button>
            <Button size="sm" onClick={() => window.location.href = "/map"} className="gap-1.5">
              Back to Map
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
