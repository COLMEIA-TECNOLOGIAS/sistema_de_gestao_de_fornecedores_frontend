import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { productsAPI } from "../../services/api";
import { useCategories, useInvalidate } from "../../hooks/queries";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../../utils/apiHelpers";

export default function ModalCriarProduto({ isOpen, onClose, onSuccess, productToEdit = null }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        unit: "Unidade",
        category_id: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const toast = useToast();
    const invalidate = useInvalidate();
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isCategoriesError,
        refetch: refetchCategories,
        isFetching: isFetchingCategories,
    } = useCategories({ enabled: isOpen });

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setFormData({
                    name: productToEdit.name || "",
                    description: productToEdit.description || "",
                    unit: productToEdit.unit || "Unidade",
                    category_id: productToEdit.category_id ?? productToEdit.category?.id ?? ""
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    unit: "Unidade",
                    category_id: ""
                });
            }
            setError(null);
            setFieldErrors({});
        }
    }, [isOpen, productToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleClose = () => {
        if (isSaving) return;
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        const payload = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            unit: formData.unit.trim() || "Unidade",
        };

        if (!payload.name || !payload.category_id) {
            setError("Nome e Categoria são obrigatórios");
            return;
        }

        setIsSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const message = productToEdit ? "Produto actualizado com sucesso!" : "Produto criado com sucesso!";
            const result = productToEdit
                ? await productsAPI.update(productToEdit.id, payload)
                : await productsAPI.create(payload);
            invalidate(queryKeys.products.all);
            toast.success(message);
            onSuccess?.(message, result);
            onClose();
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            setError(getErrorMessage(err, "Erro ao guardar produto. Verifique os dados."));
        } finally {
            setIsSaving(false);
        }
    };

    useModalLock(isOpen);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {productToEdit ? "Editar Produto" : "Novo Produto"}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        aria-label="Fechar"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nome do Produto <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Cimento Portland, Caneta Azul..."
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent outline-none transition-all"
                                required
                            />
                            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Descrição
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Detalhes adicionais sobre o produto..."
                                rows="3"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Categoria <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent outline-none transition-all"
                                    required
                                    disabled={isLoadingCategories}
                                >
                                    <option value="">{isLoadingCategories ? "A carregar..." : "Selecione..."}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.category_id && <p className="text-xs text-red-600 mt-1">{fieldErrors.category_id}</p>}
                                {isCategoriesError && categories.length === 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        Erro ao carregar categorias.{" "}
                                        <button type="button" onClick={() => refetchCategories()} disabled={isFetchingCategories} className="font-semibold underline disabled:opacity-50">
                                            {isFetchingCategories ? "A tentar..." : "Tentar novamente"}
                                        </button>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Unidade de Medida
                                </label>
                                <input
                                    type="text"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    placeholder="Ex: Kg, Unidade, Cx..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#44B16F] text-white font-medium hover:bg-[#3a965d] active:bg-[#2f7d4e] rounded-xl transition-colors shadow-sm shadow-emerald-100 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Produto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
