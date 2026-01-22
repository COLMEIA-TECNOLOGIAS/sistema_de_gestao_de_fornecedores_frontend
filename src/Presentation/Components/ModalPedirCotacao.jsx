import { useState, useEffect } from 'react';
import { X, Package, Clock, Plus, Trash2 } from 'lucide-react';
import { quotationRequestsAPI, suppliersAPI } from '../../services/api';

export default function ModalPedirCotacao({ isOpen, onClose, fornecedor }) {
    const [showAddProducts, setShowAddProducts] = useState(false);
    const [pedidoAssunto, setPedidoAssunto] = useState('');
    const [pedidoDescricao, setPedidoDescricao] = useState('');
    const [deadline, setDeadline] = useState('');
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productQuantity, setProductQuantity] = useState(1);
    const [productUnit, setProductUnit] = useState('un');
    const [productsList, setProductsList] = useState([]);

    // Fornecedores states
    const [fornecedoresList, setFornecedoresList] = useState([]);
    const [selectedFornecedores, setSelectedFornecedores] = useState([]);
    const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Fetch fornecedores when modal opens
    useEffect(() => {
        const fetchFornecedores = async () => {
            if (!isOpen) return;

            try {
                setIsLoadingFornecedores(true);
                const response = await suppliersAPI.getAll();
                setFornecedoresList(response.data || []);

                // Se um fornecedor foi passado como prop, seleciona-o automaticamente
                if (fornecedor) {
                    setSelectedFornecedores([fornecedor.id]);
                }
            } catch (error) {
                console.error('Erro ao buscar fornecedores:', error);
            } finally {
                setIsLoadingFornecedores(false);
            }
        };

        fetchFornecedores();
    }, [isOpen, fornecedor]);

    if (!isOpen) return null;

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
        setSelectedFornecedores([]);
        setSubmitError(null);
        setSubmitSuccess(false);
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

    const handleSendExternalLink = async () => {
        try {
            setIsSubmitting(true);
            setSubmitError(null);

            // Format deadline to MySQL format (YYYY-MM-DD HH:MM:SS)
            let formattedDeadline;
            if (deadline) {
                // deadline comes from datetime-local input in format: YYYY-MM-DDTHH:MM
                formattedDeadline = deadline.replace('T', ' ') + ':00';
            } else {
                // Default 30 days from now
                const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                formattedDeadline = defaultDate.toISOString().slice(0, 19).replace('T', ' ');
            }

            // Prepare data in the format expected by the API
            const quotationData = {
                title: pedidoAssunto,
                description: pedidoDescricao || pedidoAssunto,
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

            setSubmitSuccess(true);

            // Close modal after 2 seconds
            setTimeout(() => {
                handleCancel();
                // Optionally reload the page or update the list
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Erro ao criar pedido de cotação:', error);
            setSubmitError(error.response?.data?.message || 'Erro ao criar pedido de cotação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />

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
                                pedir cotação
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
                                Vamos terminar o processo de cadastro
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

                                    {/* Fornecedores */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fornecedores *
                                        </label>
                                        {isLoadingFornecedores ? (
                                            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                                                Carregando fornecedores...
                                            </div>
                                        ) : (
                                            <select
                                                multiple
                                                value={selectedFornecedores.map(String)}
                                                onChange={(e) => {
                                                    const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                                    setSelectedFornecedores(selected);
                                                }}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent min-h-[120px]"
                                                required
                                            >
                                                {fornecedoresList.map((forn) => (
                                                    <option key={forn.id} value={forn.id}>
                                                        {forn.commercial_name || forn.legal_name || `Fornecedor #${forn.id}`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplos fornecedores
                                        </p>
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
                                    </div>

                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome do produto
                                        </label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Computador portátil"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                        />
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
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-600">{submitError}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {submitSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
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
                                    disabled={productsList.length === 0 || !pedidoAssunto.trim() || selectedFornecedores.length === 0 || isSubmitting}
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
