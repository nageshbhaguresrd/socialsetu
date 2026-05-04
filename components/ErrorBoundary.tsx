'use client'
import { Component, type ReactNode, ReactElement } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px', textAlign: 'center',
          background: '#0F0F1A', borderRadius: '12px',
          border: '1px solid #2A2A45',
        }}>
          <p style={{ color: '#F87171', fontSize: '16px' }}>
            Something went wrong. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px', background: '#6C63FF',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
