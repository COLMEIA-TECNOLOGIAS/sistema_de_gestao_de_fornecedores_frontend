import React from 'react';
import { X, FileText, MapPin, Mail, Phone, Building2, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function ModalDetalhesFornecedor({
    isOpen,
    onClose,
    fornecedor
}) {
    if (!isOpen || !fornecedor) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Helper to get document URL
    const getDocUrl = (path) => {
        if (!path) return null;
        // Assuming the backend returns a relative path or full URL. 
        // Adjust base URL if needed. For now assuming full URL or relative to public/storage.
        // If it comes from API as 'suppliers/documents/...', prepend API base or storage URL.
        // Assuming for now it's a direct accessible link or we need to construct it.
        // Let's assume it might need a prefix if it's not absolute.
        if (path.startsWith('http')) return path;
        return `https://mosap3-api.yetuware.com/storage/${path}`; // Adjustable based on actual API storage path
    };

    const StatusBadge = ({ isActive }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
            {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isActive ? 'Ativo' : 'Inativo'}
        </span>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-6">
                        {/* Avatar/Logo Placeholder */}
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-2">
                            <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${fornecedor.commercial_name}`}
                                alt={fornecedor.commercial_name}
                                className="w-full h-full rounded-xl object-cover"
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {fornecedor.commercial_name}
                                </h2>
                                <StatusBadge isActive={fornecedor.is_active} />
                            </div>
                            <p className="text-gray-500 font-medium">{fornecedor.legal_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Building2 size={14} />
                                    {fornecedor.activity_type === 'product' ? 'Fornecedor de Produtos' :
                                        fornecedor.activity_type === 'service' ? 'Prestador de Serviços' : fornecedor.activity_type}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    Desde {formatDate(fornecedor.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">ID do Fornecedor</p>
                            <p className="text-xl font-mono font-bold text-gray-900">#{String(fornecedor.id).padStart(4, '0')}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 overflow-y-auto flex-1 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                        {/* Left Column: Info */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                    Informações de Contacto
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Email Profissional</p>
                                            <p className="text-gray-900 font-medium">{fornecedor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Telefone</p>
                                            <p className="text-gray-900 font-medium">{fornecedor.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                    Localização
                                </h3>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-medium mb-1">
                                            {fornecedor.address}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {fornecedor.municipality}, {fornecedor.province}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">Angola</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Legal & Docs */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                    Dados Fiscais
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium mb-1">NIF</p>
                                            <p className="text-lg font-mono font-bold text-gray-900">{fornecedor.nif}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium mb-1">Categoria Principal</p>
                                            <p className="text-gray-900 font-medium">
                                                {fornecedor.categories && fornecedor.categories.length > 0
                                                    ? fornecedor.categories.map(c => c.name).join(', ')
                                                    : 'Geral'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                    Documentação
                                </h3>
                                <div className="space-y-3">
                                    {fornecedor.commercial_certificate && (
                                        <a
                                            href={getDocUrl(fornecedor.commercial_certificate)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#44B16F] hover:bg-[#44B16F]/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-[#44B16F]">Certificado Comercial</p>
                                                    <p className="text-xs text-gray-500">Documento PDF/Imagem</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-[#44B16F] opacity-0 group-hover:opacity-100 transition-opacity">
                                                Visualizar
                                            </span>
                                        </a>
                                    )}

                                    {fornecedor.commercial_license && (
                                        <a
                                            href={getDocUrl(fornecedor.commercial_license)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#44B16F] hover:bg-[#44B16F]/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-[#44B16F]">Alvará Comercial</p>
                                                    <p className="text-xs text-gray-500">Documento PDF/Imagem</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-[#44B16F] opacity-0 group-hover:opacity-100 transition-opacity">
                                                Visualizar
                                            </span>
                                        </a>
                                    )}

                                    {fornecedor.nif_proof && (
                                        <a
                                            href={getDocUrl(fornecedor.nif_proof)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#44B16F] hover:bg-[#44B16F]/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-[#44B16F]">Comprovativo NIF</p>
                                                    <p className="text-xs text-gray-500">Documento PDF/Imagem</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-[#44B16F] opacity-0 group-hover:opacity-100 transition-opacity">
                                                Visualizar
                                            </span>
                                        </a>
                                    )}

                                    {!fornecedor.commercial_certificate && !fornecedor.commercial_license && !fornecedor.nif_proof && (
                                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 text-sm">Nenhum documento disponível.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
