import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { categoriesAPI, productsAPI } from "../../services/api";
import Toast from "./Toast";

export default function ModalCriarProduto({ isOpen, onClose, onSuccess, productToEdit = null }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        unit: "Unidade",
        category_id: ""
    });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (productToEdit) {
                setFormData({
                    name: productToEdit.name || "",
                    description: productToEdit.description || "",
                    unit: productToEdit.unit || "Unidade",
                    category_id: productToEdit.category_id || ""
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
        }
    }, [isOpen, productToEdit]);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await categoriesAPI.getAll();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erro ao carregar categorias:", err);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.category_id) {
            setError("Nome e Categoria são obrigatórios");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            if (productToEdit) {
                await productsAPI.update(productToEdit.id, formData);
                onSuccess("Produto atualizado com sucesso!");
            } else {
                await productsAPI.create(formData);
                onSuccess("Produto criado com sucesso!");
            }
            onClose();
        } catch (err) {
            console.error("Erro ao salvar produto:", err);
            setError(err.response?.data?.message || "Erro ao salvar produto. Verifique os dados.");
        } finally {
            setIsSaving(false);
        }
    };

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
                        onClick={onClose}
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
                                    disabled={isLoading}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
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
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#44B16F] text-white font-medium hover:bg-[#3a965d] active:bg-[#2f7d4e] rounded-xl transition-colors shadow-sm shadow-emerald-100 flex items-center gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Salvar Produto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
