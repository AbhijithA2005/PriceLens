import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Plotly Component Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', margin: '1rem 0', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Chart Display Error</h3>
          <p style={{ color: '#8b8b9e', fontSize: '0.9rem' }}>
            There was a problem loading the 3D interactive chart. 
            Please try refreshing the page or checking your browser's WebGL support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
