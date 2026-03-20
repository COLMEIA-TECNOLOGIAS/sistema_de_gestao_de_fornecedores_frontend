import { useState, useEffect, useMemo } from 'react';
import { X, Package, Clock, Plus, Trash2, Search, Upload, FileText, Eye, Paperclip } from 'lucide-react';
import { quotationRequestsAPI, suppliersAPI, productsAPI, categoriesAPI } from '../../services/api';

// CATEGORIAS_FILTRO will be fetched from API now

export default function ModalPedirCotacao({ isOpen, onClose, fornecedor, activityName = '' }) {
    const [showAddProducts, setShowAddProducts] = useState(false);
    const [pedidoAssunto, setPedidoAssunto] = useState('');
    const [pedidoDescricao, setPedidoDescricao] = useState('');
    const [deadline, setDeadline] = useState('');
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

    // User session for auto-signature
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // If activityName is given, pre-fill subject
    useEffect(() => {
        if (activityName && isOpen) {
            setPedidoAssunto(activityName);
        }
    }, [activityName, isOpen]);

    // Fetch fornecedores and categories when modal opens
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!isOpen) return;

            try {
                setIsLoadingFornecedores(true);
                setIsLoadingCategories(true);

                const [suppliersRes, categoriesRes] = await Promise.all([
                    suppliersAPI.getAll(),
                    categoriesAPI.getAll()
                ]);

                setFornecedoresList(suppliersRes.data || []);
                setCategories(categoriesRes || []);

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
        setShowAddProducts(false);
        setPedidoAssunto('');
        setPedidoDescricao('');
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

    // Build description with auto-signature
    const getDescriptionWithSignature = () => {
        const userName = currentUser?.name || 'Valdemar de Oliveira';
        const signature = `\n\n---\n${userName}\nContacto: procurement@mosap3.ao`;
        return (pedidoDescricao || pedidoAssunto) + signature;
    };

    const handleSendExternalLink = async () => {
        try {
            if (selectedFornecedores.length < 3) {
                setSubmitError('É obrigatório selecionar no mínimo 3 fornecedores para enviar o pedido de cotação.');
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

            // Prepare FormData if there are attachments
            const hasAttachments = attachedDocuments.length > 0;

            if (hasAttachments) {
                const formData = new FormData();
                formData.append('title', pedidoAssunto);
                formData.append('description', descriptionWithSignature);
                formData.append('deadline', formattedDeadline);

                productsList.forEach((product, index) => {
                    formData.append(`items[${index}][name]`, product.name);
                    formData.append(`items[${index}][quantity]`, product.quantity);
                    formData.append(`items[${index}][unit]`, product.unit);
                    formData.append(`items[${index}][specifications]`, product.specifications || '');
                });

                selectedFornecedores.forEach((id, index) => {
                    formData.append(`suppliers[${index}]`, id);
                });

                attachedDocuments.forEach((file, index) => {
                    formData.append(`documents[${index}]`, file);
                });

                console.log('Enviando pedido de cotação com documentos...');
                const response = await quotationRequestsAPI.createWithDocuments(formData);
                console.log('Resposta da API:', response);
            } else {
                const quotationData = {
                    title: pedidoAssunto,
                    description: descriptionWithSignature,
                    deadline: formattedDeadline,
                    items: productsList.map(product => ({
                        name: product.name,
                        quantity: product.quantity,
                        unit: product.unit,
                        specifications: product.specifications || ''
                    })),
                    suppliers: selectedFornecedores
                };

                console.log('Enviando pedido de cotação:', quotationData);
                const response = await quotationRequestsAPI.create(quotationData);
                console.log('Resposta da API:', response);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="absolute inset-0 z-[60] bg-black/70 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">{previewDoc.name}</h3>
                            <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-auto bg-gray-50 flex items-center justify-center">
                            {previewDoc.type.startsWith("image/") ? (
                                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                            ) : previewDoc.type === "application/pdf" ? (
                                <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-[60vh] rounded-lg" />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Pré-visualização não disponível</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar
                    </button>
                    {fornecedor && (
                        <span className="text-sm text-gray-500">
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
                            <div className="w-24 h-24 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
                                <Package className="w-12 h-12 text-[#44B16F]" strokeWidth={1.5} />
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                Solicitar cotação
                            </h2>

                            {/* Subtitle */}
                            <p className="text-gray-500 mb-8 max-w-md">
                                Adicione os produtos no qual deseja pedir a cotação
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                                Adicionar produtos
                            </h2>
                            <p className="text-gray-500 text-center mb-8">
                                Complete o pedido de cotação
                            </p>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Form */}
                                <div className="space-y-6">
                                    {/* Assunto do Pedido */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Assunto do pedido *
                                        </label>
                                        <input
                                            type="text"
                                            value={pedidoAssunto}
                                            onChange={(e) => setPedidoAssunto(e.target.value)}
                                            placeholder="Materiais para trabalho"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Descrição do Pedido */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrição do pedido
                                        </label>
                                        <textarea
                                            value={pedidoDescricao}
                                            onChange={(e) => setPedidoDescricao(e.target.value)}
                                            placeholder="Descreva detalhes adicionais sobre o pedido..."
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent resize-none"
                                        />
                                        {/* Auto-signature preview */}
                                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1 font-medium">Assinatura automática:</p>
                                            <p className="text-xs text-gray-700 font-semibold">{currentUser?.name || 'Valdemar de Oliveira'}</p>
                                            <p className="text-xs text-gray-600">Contacto: procurement@mosap3.ao</p>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prazo (deadline)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Se não especificar, será definido 30 dias a partir de hoje</p>
                                    </div>

                                    {/* Document Attachment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Paperclip size={14} className="inline-block mr-1 -mt-0.5" />
                                            Anexar documentos
                                        </label>
                                        {attachedDocuments.length > 0 && (
                                            <div className="mb-2 space-y-2">
                                                {attachedDocuments.map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-emerald-50 border border-[#44B16F]/20 rounded-lg px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={14} className="text-[#44B16F]" />
                                                            <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{doc.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePreviewDocument(doc)}
                                                                className="p-1 hover:bg-[#44B16F]/10 rounded transition-colors"
                                                                title="Pré-visualizar"
                                                            >
                                                                <Eye size={14} className="text-[#44B16F]" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveDocument(index)}
                                                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#44B16F] transition-colors bg-gray-50 hover:bg-emerald-50/50">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleDocumentAttach}
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                            />
                                            <Upload size={16} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 font-medium">Clique para anexar documentos</span>
                                        </label>
                                    </div>

                                    {/* Fornecedores with Category Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fornecedores *
                                        </label>

                                        {/* Category Filter */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setCategoriaFiltro("")}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${categoriaFiltro === ""
                                                    ? 'bg-[#44B16F] text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
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
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Search fornecedores */}
                                        <div className="relative mb-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                value={fornecedorSearchQuery}
                                                onChange={(e) => setFornecedorSearchQuery(e.target.value)}
                                                placeholder="Pesquisar fornecedores..."
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent text-sm"
                                            />
                                        </div>

                                        {isLoadingFornecedores ? (
                                            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                                                Carregando fornecedores...
                                            </div>
                                        ) : (
                                            <div className="border border-gray-300 rounded-lg max-h-[150px] overflow-y-auto">
                                                {filteredFornecedores.length === 0 ? (
                                                    <div className="p-3 text-sm text-gray-500 text-center">Nenhum fornecedor encontrado</div>
                                                ) : (
                                                    filteredFornecedores.map((forn) => (
                                                        <label
                                                            key={forn.id}
                                                            className={`flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${selectedFornecedores.includes(forn.id) ? 'bg-emerald-50' : ''
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFornecedores.includes(forn.id)}
                                                                onChange={() => toggleFornecedor(forn.id)}
                                                                className="rounded border-gray-300 text-[#44B16F] focus:ring-[#44B16F]"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                                    {forn.commercial_name || forn.legal_name || `#${forn.id}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">{forn.email || ''}</p>
                                                            </div>
                                                            {forn.categories && forn.categories.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 shrink-0">
                                                                    {forn.categories.slice(0, 2).map((cat, idx) => (
                                                                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                                                            {cat.name}
                                                                        </span>
                                                                    ))}
                                                                    {forn.categories.length > 2 && (
                                                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
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
                                                Selecione mais {3 - selectedFornecedores.length} {3 - selectedFornecedores.length === 1 ? 'fornecedor' : 'fornecedores'} (mínimo 3).
                                            </p>
                                        )}
                                    </div>

                                    {/* Product Name */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome do produto
                                        </label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            onFocus={() => { if (productName.length >= 2) setShowSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            placeholder="Computador portátil"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                        />
                                        {showSuggestions && filteredProducts.length > 0 && (
                                            <div className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {filteredProducts.map(product => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => handleSelectProduct(product)}
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                    >
                                                        <p className="font-medium text-sm text-gray-800">{product.name}</p>
                                                        {product.description && (
                                                            <p className="text-xs text-gray-500 truncate">{product.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Especificações
                                        </label>
                                        <textarea
                                            value={productDescription}
                                            onChange={(e) => setProductDescription(e.target.value)}
                                            placeholder="HP, i5 de 11gen com 32G de RAM e 1T de ROM"
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent resize-none"
                                        />
                                    </div>

                                    {/* Quantity and Unit */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quantidade
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={productQuantity}
                                                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Unidade
                                            </label>
                                            <select
                                                value={productUnit}
                                                onChange={(e) => setProductUnit(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                            >
                                                <option value="un">Unidade (un)</option>
                                                <option value="kg">Quilograma (kg)</option>
                                                <option value="g">Grama (g)</option>
                                                <option value="l">Litro (l)</option>
                                                <option value="ml">Mililitro (ml)</option>
                                                <option value="m">Metro (m)</option>
                                                <option value="cm">Centímetro (cm)</option>
                                                <option value="m²">Metro Quadrado (m²)</option>
                                                <option value="pc">Peça (pc)</option>
                                                <option value="cx">Caixa (cx)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Add Product Button */}
                                    <button
                                        onClick={handleAddProduct}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-500 transition-all font-medium"
                                    >
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                            <Plus className="w-3 h-3" strokeWidth={3} />
                                        </div>
                                        Adicionar produto
                                    </button>
                                </div>

                                {/* Right Column - Products List */}
                                <div>
                                    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[400px] overflow-y-auto">
                                        {productsList.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <Package className="w-16 h-16 mb-4" strokeWidth={1.5} />
                                                <p className="text-sm">Nenhum produto adicionado</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {productsList.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        className="bg-white rounded-lg px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {product.quantity} {product.unit}
                                                            </p>
                                                            {product.specifications && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                    {product.specifications}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-4">
                                                            {/* Quantity Controls */}
                                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                                                                <button
                                                                    onClick={() => handleDecreaseQuantity(product.id)}
                                                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                                                    disabled={product.quantity <= 1}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                    </svg>
                                                                </button>
                                                                <span className="text-sm font-medium text-gray-900 min-w-[20px] text-center">
                                                                    {product.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleIncreaseQuantity(product.id)}
                                                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={() => handleRemoveProduct(product.id)}
                                                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {submitError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mt-6">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-600">{submitError}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {submitSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mt-6">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-green-600">Pedido de cotação criado com sucesso! Redirecionando...</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
                                <button
                                    onClick={handleSendExternalLink}
                                    disabled={productsList.length === 0 || !pedidoAssunto.trim() || selectedFornecedores.length < 3 || isSubmitting}
                                    className="px-8 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
    );
}
