import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-4xl">:(</div>
            <h2 className="text-lg font-semibold text-text-primary">Cos poszlo nie tak</h2>
            <p className="text-sm text-text-secondary">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent-dim"
            >
              Sprobuj ponownie
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
