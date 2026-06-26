import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Clock, Plus, Trash2, Search, Upload, FileText, Eye, Paperclip } from 'lucide-react';
import { quotationRequestsAPI, suppliersAPI, productsAPI, categoriesAPI } from '../../services/api';

// CATEGORIAS_FILTRO will be fetched from API now

export default function ModalPedirCotacao({ isOpen, onClose, fornecedor, activityName = '', activityDescription = '', activityReference = '', buyerEmail = '' }) {
    const [showAddProducts, setShowAddProducts] = useState(true);
    const [pedidoAssunto, setPedidoAssunto] = useState('');
    const [pedidoDescricao, setPedidoDescricao] = useState('');
    const [activityDesc, setActivityDesc] = useState('');
    const [deadline, setDeadline] = useState('');
    const [pedidoReferencia, setPedidoReferencia] = useState('');
    const [pedidoBuyerEmail, setPedidoBuyerEmail] = useState('');
    const [rightColView, setRightColView] = useState('products');
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productQuantity, setProductQuantity] = useState(1);
    const [productUnit, setProductUnit] = useState('un');
    const [productsList, setProductsList] = useState([]);

    // Autocomplete states
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Fornecedores states
    const [fornecedoresList, setFornecedoresList] = useState([]);
    const [selectedFornecedores, setSelectedFornecedores] = useState([]);
    const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(false);
    const [fornecedorSearchQuery, setFornecedorSearchQuery] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Document attachment states
    const [attachedDocuments, setAttachedDocuments] = useState([]);
    const [previewDoc, setPreviewDoc] = useState(null);

    useModalLock(isOpen);

    // User session for auto-signature
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // If activityName, activityDescription, activityReference or buyerEmail is given, pre-fill
    useEffect(() => {
        if (isOpen) {
            if (activityName) setPedidoAssunto(activityName);
            if (activityDescription) setActivityDesc(activityDescription);
            if (activityReference) setPedidoReferencia(activityReference);
            if (buyerEmail) setPedidoBuyerEmail(buyerEmail);
        }
    }, [activityName, activityDescription, activityReference, buyerEmail, isOpen]);

    // Reset state and fetch fornecedores and categories when modal opens
    useEffect(() => {
        if (!isOpen) return;

        // Reset to full form view so suppliers and categories are visible
        setShowAddProducts(true);

        const fetchInitialData = async () => {
            try {
                setIsLoadingFornecedores(true);
                setIsLoadingCategories(true);

                const [suppliersRes, categoriesRes] = await Promise.all([
                    suppliersAPI.getAll().catch(err => {
                        console.warn('Erro ao buscar fornecedores:', err);
                        return { data: [] };
                    }),
                    categoriesAPI.getAll().catch(err => {
                        console.warn('Erro ao buscar categorias:', err);
                        return [];
                    })
                ]);

                const suppliers = Array.isArray(suppliersRes) ? suppliersRes : (suppliersRes?.data || []);
                const cats = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);

                setFornecedoresList(suppliers);
                setCategories(cats);

                // Se um fornecedor foi passado como prop, seleciona-o automaticamente
                if (fornecedor) {
                    setSelectedFornecedores([fornecedor.id]);
                }
            } catch (error) {
                console.error('Erro ao buscar dados iniciais:', error);
            } finally {
                setIsLoadingFornecedores(false);
                setIsLoadingCategories(false);
            }
        };

        fetchInitialData();
    }, [isOpen, fornecedor]);

    // Search products when user types
    useEffect(() => {
        const searchProducts = async () => {
            if (productName.trim().length >= 2) {
                try {
                    const res = await productsAPI.search(productName);
                    let items = [];
                    if (res.data && Array.isArray(res.data)) {
                        items = res.data;
                    } else if (Array.isArray(res)) {
                        items = res;
                    }
                    const filtered = items.filter(p =>
                        p.name.toLowerCase().includes(productName.toLowerCase())
                    );
                    setFilteredProducts(filtered);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Erro ao buscar produtos:", error);
                }
            } else {
                setFilteredProducts([]);
                setShowSuggestions(false);
            }
        };

        const timer = setTimeout(searchProducts, 300);
        return () => clearTimeout(timer);
    }, [productName]);

    // Filter fornecedores by category and search
    const filteredFornecedores = useMemo(() => {
        let result = fornecedoresList;

        // Filter by category
        if (categoriaFiltro) {
            result = result.filter(f =>
                f.categories && f.categories.some(cat => String(cat.id) === String(categoriaFiltro))
            );
        }

        // Filter by search
        if (fornecedorSearchQuery.trim()) {
            const q = fornecedorSearchQuery.toLowerCase();
            result = result.filter(f =>
                (f.commercial_name || '').toLowerCase().includes(q) ||
                (f.legal_name || '').toLowerCase().includes(q) ||
                (f.email || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [fornecedoresList, categoriaFiltro, fornecedorSearchQuery]);

    if (!isOpen) return null;

    const handleSelectProduct = (product) => {
        setProductName(product.name);
        setProductDescription(product.description || "");
        if (product.unit) setProductUnit(product.unit);
        setShowSuggestions(false);
    };

    const handleContinue = () => {
        setShowAddProducts(true);
    };

    const handleCancel = () => {
        setPedidoAssunto('');
        setPedidoDescricao('');
        setActivityDesc('');
        setDeadline('');
        setProductName('');
        setProductDescription('');
        setProductQuantity(1);
        setProductUnit('un');
        setProductsList([]);
        setFilteredProducts([]);
        setShowSuggestions(false);
        setSelectedFornecedores([]);
        setSubmitError(null);
        setSubmitSuccess(false);
        setAttachedDocuments([]);
        setPreviewDoc(null);
        setCategoriaFiltro('');
        setFornecedorSearchQuery('');
        setPedidoReferencia('');
        setPedidoBuyerEmail('');
        setRightColView('products');
        onClose();
    };

    const handleAddProduct = () => {
        if (productName.trim()) {
            const newProduct = {
                id: Date.now(),
                name: productName,
                specifications: productDescription,
                quantity: productQuantity,
                unit: productUnit
            };
            setProductsList([...productsList, newProduct]);
            setProductName('');
            setProductDescription('');
            setProductQuantity(1);
            setProductUnit('un');
        }
    };

    const handleRemoveProduct = (id) => {
        setProductsList(productsList.filter(product => product.id !== id));
    };

    const handleIncreaseQuantity = (id) => {
        setProductsList(productsList.map(product =>
            product.id === id
                ? { ...product, quantity: product.quantity + 1 }
                : product
        ));
    };

    const handleDecreaseQuantity = (id) => {
        setProductsList(productsList.map(product =>
            product.id === id && product.quantity > 1
                ? { ...product, quantity: product.quantity - 1 }
                : product
        ));
    };

    const handleDocumentAttach = (e) => {
        const files = Array.from(e.target.files);
        setAttachedDocuments(prev => [...prev, ...files]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveDocument = (index) => {
        setAttachedDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handlePreviewDocument = (file) => {
        const url = URL.createObjectURL(file);
        setPreviewDoc({ name: file.name, url, type: file.type });
    };

    const closePreview = () => {
        if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
        setPreviewDoc(null);
    };

    // Calculate min date: 15 business days from today
    const minDeadline = (() => {
        const date = new Date();
        let businessDays = 0;
        while (businessDays < 15) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay();
            if (day !== 0 && day !== 6) businessDays++;
        }
        return date.toISOString().slice(0, 16);
    })();

    // Build description without auto-signature
    const getDescriptionWithSignature = () => {
        return (pedidoDescricao || pedidoAssunto || '');
    };

    const handleSendExternalLink = async () => {
        try {
            if (selectedFornecedores.length < 3) {
                setSubmitError('É obrigatório selecionar no mínimo 3 licitantes para enviar o pedido de cotação.');
                return;
            }

            setIsSubmitting(true);
            setSubmitError(null);

            // Format deadline
            let formattedDeadline;
            if (deadline) {
                formattedDeadline = deadline.replace('T', ' ') + ':00';
            } else {
                const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                formattedDeadline = defaultDate.toISOString().slice(0, 19).replace('T', ' ');
            }

            // Build description with signature
            const descriptionWithSignature = getDescriptionWithSignature();

            // If productsList is empty, prefill with a single placeholder representing the cotação
            const finalProductsList = productsList.length > 0 ? productsList : [
                {
                    name: pedidoAssunto || 'Solicitação de Cotação',
                    quantity: 1,
                    unit: 'un',
                    specifications: pedidoDescricao || 'Conforme especificações anexas.'
                }
            ];

            // Prepare FormData if there are attachments
            const hasAttachments = attachedDocuments.length > 0;

            let response;
            if (hasAttachments) {
                const formData = new FormData();
                formData.append('title', pedidoAssunto);
                formData.append('reference', pedidoReferencia);
                formData.append('reference_number', pedidoReferencia);
                formData.append('buyer_email', pedidoBuyerEmail);
                formData.append('buyer', pedidoBuyerEmail);
                formData.append('ocultar_referencia', '1');
                formData.append('ocultar_referencia_automatica', '1');
                formData.append('hide_auto_reference', '1');
                formData.append('description', descriptionWithSignature);
                formData.append('activity_description', activityDesc);
                formData.append('deadline', formattedDeadline);

                finalProductsList.forEach((product, index) => {
                    formData.append(`items[${index}][name]`, product.name);
                    formData.append(`items[${index}][quantity]`, product.quantity);
                    formData.append(`items[${index}][unit]`, product.unit);
                    formData.append(`items[${index}][specifications]`, product.specifications || '');
                });

                selectedFornecedores.forEach((id) => {
                    formData.append('suppliers[]', id);
                });

                attachedDocuments.forEach((file) => {
                    formData.append('documents[]', file);
                });

                console.log('Enviando pedido de cotação com documentos...');
                response = await quotationRequestsAPI.createWithDocuments(formData);
                console.log('Resposta da API:', response);
            } else {
                const quotationData = {
                    title: pedidoAssunto,
                    reference: pedidoReferencia,
                    reference_number: pedidoReferencia,
                    buyer_email: pedidoBuyerEmail,
                    buyer: pedidoBuyerEmail,
                    ocultar_referencia: true,
                    ocultar_referencia_automatica: true,
                    hide_auto_reference: true,
                    description: descriptionWithSignature,
                    activity_description: activityDesc,
                    deadline: formattedDeadline,
                    items: finalProductsList.map(product => ({
                        name: product.name,
                        quantity: product.quantity,
                        unit: product.unit,
                        specifications: product.specifications || ''
                    })),
                    suppliers: selectedFornecedores
                };

                console.log('Enviando pedido de cotação:', quotationData);
                response = await quotationRequestsAPI.create(quotationData);
                console.log('Resposta da API:', response);
            }

            // Envia automaticamente o pedido criado por email aos fornecedores (mudando status para enviado)
            const createdId = response?.id || response?.data?.id;
            if (createdId) {
                try {
                    console.log('Enviando cotação criada automaticamente para os fornecedores:', createdId);
                    await quotationRequestsAPI.send(createdId);
                } catch (sendErr) {
                    console.warn('Pedido criado, mas falhou ao enviar notificação aos fornecedores:', sendErr);
                }
            }

            setSubmitSuccess(true);
            setTimeout(() => {
                handleCancel();
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Erro ao criar pedido de cotação:', error);
            setSubmitError(error.response?.data?.message || 'Erro ao criar pedido de cotação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFornecedor = (id) => {
        setSelectedFornecedores(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="absolute inset-0 z-[60] bg-black/70 flex items-center justify-center">
                    <div className="rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{previewDoc.name}</h3>
                            <button onClick={closePreview} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                            {previewDoc.type.startsWith("image/") ? (
                                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                            ) : previewDoc.type === "application/pdf" ? (
                                <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-[60vh] rounded-lg" />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText size={64} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                                    <p style={{ color: 'var(--color-text-secondary)' }}>Pré-visualização não disponível</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <div className="relative rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--color-surface)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 transition-colors font-medium"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar
                    </button>
                    {fornecedor && (
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {showAddProducts ? 'Cotação' : ''} - {fornecedor.commercial_name}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="px-8 py-12 overflow-y-auto flex-1">
                    {!showAddProducts ? (
                        // Initial Modal - Pedir Cotação
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(68,177,111,0.1)' }}>
                                <Package className="w-12 h-12 text-[#44B16F]" strokeWidth={1.5} />
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                Solicitar cotação
                            </h2>

                            {/* Subtitle */}
                            <p className="mb-8 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
                                Adicione os produtos no qual deseja pedir a cotação
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-8 py-3 rounded-lg transition-colors font-medium"
                                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', background: 'transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleContinue}
                                    className="px-8 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium shadow-sm"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Add Products Modal
                        <div>
                            {/* Title */}
                            <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>
                                Solicitar Cotação
                            </h2>
                            <p className="text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                                Complete o pedido de cotação
                            </p>

                            {/* Single Column Layout */}
                            <div className="max-w-3xl mx-auto space-y-6">
                                {/* Hidden fields — values are pre-filled from activity registration */}
                                <input type="hidden" value={pedidoAssunto} onChange={(e) => setPedidoAssunto(e.target.value)} />
                                <input type="hidden" value={pedidoReferencia} onChange={(e) => setPedidoReferencia(e.target.value)} />

                                {/* Corpo da Mensagem */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                        Corpo da mensagem
                                    </label>
                                    <textarea
                                        value={pedidoDescricao}
                                        onChange={(e) => setPedidoDescricao(e.target.value)}
                                        placeholder="Descreva detalhes adicionais sobre o pedido..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] resize-none transition-all text-sm"
                                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                    />
                                </div>

                                {/* Prazo de Resposta */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                        Data de entrega
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        min={minDeadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] transition-all text-sm"
                                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                    />
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>O prazo mínimo é de 15 dias úteis a partir de hoje.</p>
                                </div>

                                {/* Document Attachment */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <Paperclip size={14} className="inline-block mr-1 -mt-0.5" />
                                        Anexar documentos
                                    </label>
                                    {attachedDocuments.length > 0 && (
                                        <div className="mb-2 space-y-2">
                                            {attachedDocuments.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(68,177,111,0.08)', border: '1px solid rgba(68,177,111,0.2)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-[#44B16F]" />
                                                        <span className="text-xs font-medium truncate max-w-[180px]" style={{ color: 'var(--color-text-primary)' }}>{doc.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePreviewDocument(doc)}
                                                            className="p-1 rounded transition-colors"
                                                            title="Pré-visualizar"
                                                        >
                                                            <Eye size={14} className="text-[#44B16F]" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDocument(index)}
                                                            className="p-1 rounded transition-colors"
                                                        >
                                                            <X size={14} className="text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm" style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleDocumentAttach}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                        />
                                        <Upload size={16} />
                                        <span className="font-medium">Clique para anexar documentos</span>
                                    </label>
                                </div>

                                {/* Licitantes with Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                        Licitantes *
                                    </label>

                                    {/* Category Filter */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setCategoriaFiltro("")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${categoriaFiltro === ""
                                                ? 'bg-[#44B16F] text-white shadow-sm'
                                                : ''
                                                }`}
                                            style={categoriaFiltro !== "" ? { background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' } : {}}
                                        >
                                            Todas as categorias
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoriaFiltro(cat.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${String(categoriaFiltro) === String(cat.id)
                                                    ? 'bg-[#44B16F] text-white shadow-sm'
                                                    : ''
                                                    }`}
                                                style={String(categoriaFiltro) !== String(cat.id) ? { background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' } : {}}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search licitantes */}
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-text-muted)' }} />
                                        <input
                                            type="text"
                                            value={fornecedorSearchQuery}
                                            onChange={(e) => setFornecedorSearchQuery(e.target.value)}
                                            placeholder="Pesquisar licitantes..."
                                            className="w-full pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] text-sm transition-all"
                                            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                        />
                                    </div>

                                    {isLoadingFornecedores ? (
                                        <div className="w-full px-4 py-3 rounded-lg text-sm" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                            Carregando licitantes...
                                        </div>
                                    ) : (
                                        <div className="rounded-lg max-h-[180px] overflow-y-auto" style={{ border: '1px solid var(--color-border)' }}>
                                            {filteredFornecedores.length === 0 ? (
                                                <div className="p-3 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Nenhum licitante encontrado</div>
                                            ) : (
                                                filteredFornecedores.map((forn) => (
                                                    <label
                                                        key={forn.id}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                                                        style={{
                                                            borderBottom: '1px solid var(--color-border-light)',
                                                            background: selectedFornecedores.includes(forn.id) ? 'rgba(68,177,111,0.08)' : 'transparent'
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFornecedores.includes(forn.id)}
                                                            onChange={() => toggleFornecedor(forn.id)}
                                                            className="rounded border-gray-300 text-[#44B16F] focus:ring-[#44B16F]"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                                {forn.commercial_name || forn.legal_name || `#${forn.id}`}
                                                            </p>
                                                            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{forn.email || ''}</p>
                                                        </div>
                                                        {forn.categories && forn.categories.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 shrink-0">
                                                                {forn.categories.slice(0, 2).map((cat, idx) => (
                                                                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                                                        {cat.name}
                                                                    </span>
                                                                ))}
                                                                {forn.categories.length > 2 && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                                                        +{forn.categories.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    {selectedFornecedores.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedFornecedores.map(id => {
                                                const forn = fornecedoresList.find(f => f.id === id);
                                                return forn ? (
                                                    <span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-[#44B16F] text-white text-xs rounded-full">
                                                        {forn.commercial_name || forn.legal_name}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedFornecedores(selectedFornecedores.filter(f => f !== id))}
                                                            className="hover:bg-[#3a9d5f] rounded-full p-0.5"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    {selectedFornecedores.length < 3 && selectedFornecedores.length > 0 && (
                                        <p className="mt-1 text-xs text-amber-600 font-medium">
                                            Selecione mais {3 - selectedFornecedores.length} {3 - selectedFornecedores.length === 1 ? 'licitante' : 'licitantes'} (mínimo 3).
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Error Message */}
                            {submitError && (
                                <div className="rounded-lg p-4 flex items-start gap-3 mt-6" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-500">{submitError}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {submitSuccess && (
                                <div className="rounded-lg p-4 flex items-start gap-3 mt-6" style={{ background: 'rgba(68,177,111,0.08)', border: '1px solid rgba(68,177,111,0.25)' }}>
                                    <svg className="w-5 h-5 text-[#44B16F] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-[#44B16F]">Pedido de cotação criado com sucesso! Redirecionando...</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 mt-6" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                <button
                                    onClick={handleSendExternalLink}
                                    disabled={!pedidoAssunto.trim() || selectedFornecedores.length < 3 || isSubmitting}
                                    className="px-8 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar pedido de cotação'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
