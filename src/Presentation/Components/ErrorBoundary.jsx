import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, background: '#f8d7da', color: '#721c24', position: 'fixed', zIndex: 100000, top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo correu mal no Modal!</h1>
                    <pre style={{ marginTop: 20, whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</pre>
                    <pre style={{ marginTop: 20, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        style={{ marginTop: 20, padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
