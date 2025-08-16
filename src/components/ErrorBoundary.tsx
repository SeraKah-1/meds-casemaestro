import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // optional: send to analytics
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="container-narrow mt-6 p-4 border rounded bg-red-50 text-sm text-red-700">
          Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}
