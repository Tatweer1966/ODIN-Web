import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";
import { logger } from "../../core/logger/logger";

interface State { hasError: boolean; }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Unhandled frontend error", { message: error.message, componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="app-fatal-error" role="alert">
          <strong>JCWS could not load this workspace.</strong>
          <span>Reload the application. If the problem continues, contact the system administrator.</span>
          <button type="button" onClick={() => window.location.reload()}>Reload JCWS</button>
        </main>
      );
    }
    return this.props.children;
  }
}
