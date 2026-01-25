import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    AlertCircle,
    X,
    CheckCircle2,
    Tag
} from "lucide-react";
import { categoriesAPI } from "../../services/api";
import CategoriasTableSkeleton from "../Components/CategoriasTableSkeleton";
import { useAuth } from "../../context/AuthContext";

export default function CategoriasPage() {
    const { isAdmin } = useAuth();
    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        setIsLoading(true);
        try {
            const data = await categoriesAPI.getAll();
            setCategorias(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
            setStatus({ type: "error", message: "Erro ao carregar categorias." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setCurrentCategory(category);
            setFormData({ name: category.name, description: category.description || "" });
        } else {
            setCurrentCategory(null);
            setFormData({ name: "", description: "" });
        }
        setIsModalOpen(true);
        setStatus({ type: "", message: "" });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory(null);
        setFormData({ name: "", description: "" });
    };

    const handleOpenDeleteModal = (category) => {
        setCurrentCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: "", message: "" });

        try {
            if (currentCategory && currentCategory.id) {
                console.log("Atualizando categoria:", currentCategory.id, formData);
                await categoriesAPI.update(currentCategory.id, formData);
                setStatus({ type: "success", message: "Categoria atualizada com sucesso!" });
            } else {
                console.log("Criando nova categoria:", formData);
                await categoriesAPI.create(formData);
                setStatus({ type: "success", message: "Categoria criada com sucesso!" });
            }
            fetchCategorias();
            setTimeout(handleCloseModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
            const errorMessage = error.response?.data?.message || "Erro ao salvar categoria. Verifique os dados.";
            setStatus({ type: "error", message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await categoriesAPI.delete(currentCategory.id);
            setIsDeleteModalOpen(false);
            fetchCategorias();
            setStatus({ type: "success", message: "Categoria excluída com sucesso!" });
            setTimeout(() => setStatus({ type: "", message: "" }), 3000);
        } catch (error) {
            console.error("Erro ao eliminar categoria:", error);
            setStatus({ type: "error", message: "Erro ao eliminar categoria." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategorias = (Array.isArray(categorias) ? categorias : []).filter(cat => {
        const name = (cat?.name || "").toLowerCase();
        const description = (cat?.description || "").toLowerCase();
        const search = (searchTerm || "").toLowerCase();
        return name.includes(search) || description.includes(search);
    });

    return (
        <div className="space-y-6">
            {/* Header Side */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
                    <p className="text-gray-500 text-sm">Gerencie as categorias de produtos e serviços do sistema.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#44B16F] text-white font-bold rounded-xl hover:bg-[#368d58] transition-all shadow-lg shadow-[#44B16F]/20"
                    >
                        <Plus size={20} />
                        Nova Categoria
                    </button>
                )}
            </div>

            {/* Search and Alert */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar categorias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F]"
                    />
                </div>
                {status.message && status.type === "success" && !isModalOpen && (
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 border border-green-100">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-medium">{status.message}</span>
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <CategoriasTableSkeleton />
                            ) : filteredCategorias.length > 0 ? (
                                filteredCategorias.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-500">#{cat.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#44B16F]/10 flex items-center justify-center text-[#44B16F]">
                                                    <Tag size={16} />
                                                </div>
                                                <span className="font-semibold text-gray-900">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                                            {cat.description || "Sem descrição"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Edit functionality removed as per requirements */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleOpenDeleteModal(cat)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="text-gray-300" size={32} />
                                        </div>
                                        <p className="text-gray-500 font-medium">Nenhuma categoria encontrada.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Criar/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {currentCategory ? "Editar Categoria" : "Nova Categoria"}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {status.message && (
                                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}>
                                    {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 px-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Material de Escritório"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 px-1">Descrição</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva a finalidade desta categoria..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] resize-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-[#44B16F] text-white font-bold rounded-xl hover:bg-[#368d58] transition-all shadow-lg shadow-[#44B16F]/20 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {currentCategory ? "Salvar" : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Excluir */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Categoria?</h3>
                        <p className="text-gray-500 mb-6">
                            Tem certeza que deseja excluir a categoria <span className="font-bold text-gray-900">"{currentCategory?.name}"</span>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Manter
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
