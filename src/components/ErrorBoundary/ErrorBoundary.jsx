import { Component } from 'react'
import { reportError } from '../../utils/errors'
import './ErrorBoundary.css'

/**
 * ErrorBoundary — Class component that catches render-time errors anywhere
 * in its subtree and renders a fallback UI. Errors are also reported via
 * reportError() so they surface as a toast.
 *
 * Usage:
 *   <ErrorBoundary fallback={<MyFallback />}>{children}</ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    reportError(error, { context: this.props.context || 'ErrorBoundary' })
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Error caught by ErrorBoundary:', error, info)
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback({ error: this.state.error, reset: this.reset })
        : this.props.fallback
    }
    return (
      <div className="eb">
        <span className="material-symbols-outlined eb__icon">error</span>
        <h2 className="eb__title">Something went wrong</h2>
        <p className="eb__message">{this.state.error?.message || 'Unexpected error'}</p>
        <button className="eb__retry" onClick={this.reset}>Try again</button>
      </div>
    )
  }
}
