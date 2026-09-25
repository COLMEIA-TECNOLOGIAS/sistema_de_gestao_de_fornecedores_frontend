import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex flex-col items-center justify-center text-center p-8 rounded-2xl"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
                >
                    <AlertTriangle size={36} className="text-red-500 mb-3" />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Algo correu mal
                    </h2>
                    <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
                        Ocorreu um erro inesperado ao apresentar este conteúdo.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-4 text-xs text-left whitespace-pre-wrap text-red-600 max-w-2xl overflow-auto">
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 rounded-lg text-sm font-medium border"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        >
                            Tentar novamente
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                            style={{ background: 'var(--color-primary)' }}
                        >
                            Recarregar página
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
