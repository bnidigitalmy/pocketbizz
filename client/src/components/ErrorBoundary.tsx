import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  level?: 'app' | 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors to Sentry, and displays a fallback UI.
 * 
 * Usage:
 * - App level: Wrap entire <App /> to catch all errors
 * - Page level: Wrap individual routes/pages
 * - Component level: Wrap specific complex components
 * 
 * Example:
 * <ErrorBoundary level="page" onReset={() => navigate('/')}>
 *   <Dashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setContext('errorBoundary', {
        level: this.props.level || 'component',
        componentStack: errorInfo.componentStack,
      });
      scope.setExtra('errorInfo', errorInfo);
      Sentry.captureException(error);
    });

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on level
      const { level = 'component', children } = this.props;
      const { error, errorInfo } = this.state;

      // App-level error (critical)
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <CardTitle className="text-2xl">Application Error</CardTitle>
                    <CardDescription>
                      Something went wrong. We've been notified and will fix it soon.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm text-destructive">
                    {error?.message || 'Unknown error occurred'}
                  </p>
                </div>
                
                {import.meta.env.MODE === 'development' && errorInfo && (
                  <details className="bg-muted p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleReset} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  If this problem persists, please contact support.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Page-level error
      if (level === 'page') {
        return (
          <div className="container mx-auto p-6">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <CardTitle>Page Error</CardTitle>
                </div>
                <CardDescription>
                  This page encountered an error. Try refreshing or go back.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded text-sm">
                  <code className="text-destructive">
                    {error?.message || 'Unknown error'}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button onClick={this.handleReset} size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Button onClick={this.handleGoHome} size="sm" variant="outline" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component-level error (minimal UI)
      return (
        <div className="border border-destructive rounded-lg p-4 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-destructive">
                Component Error
              </p>
              <p className="text-sm text-muted-foreground">
                {error?.message || 'This component failed to render'}
              </p>
              <Button onClick={this.handleReset} size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
