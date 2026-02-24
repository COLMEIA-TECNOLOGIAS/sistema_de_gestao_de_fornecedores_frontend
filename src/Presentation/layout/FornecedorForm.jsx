import { ArrowLeft, AlertCircle, FileText, CheckCircle, Upload, X, Eye } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { suppliersAPI, categoriesAPI } from "../../services/api";
import Toast from "../Components/Toast";

// Categories are now fetched from the API

export default function FornecedorFormWrapper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const editingFornecedor = location.state?.fornecedor || null;
  const submitRef = useRef(false); // Prevent double-submit

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await categoriesAPI.getAll();
        setCategories(response || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setToast({ type: "error", message: "Erro ao carregar categorias" });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    legal_name: editingFornecedor?.legal_name || "",
    commercial_name: editingFornecedor?.commercial_name || "",
    email: editingFornecedor?.email || "",
    phone: editingFornecedor?.phone || "",
    nif: editingFornecedor?.nif || "",
    activity_type: editingFornecedor?.activity_type || "",
    province: editingFornecedor?.province || "Luanda",
    municipality: editingFornecedor?.municipality || "Viana",
    address: editingFornecedor?.address || "",
    categories: editingFornecedor?.categories?.map(c => c.id) || [],
    // New category multi-select (Bens, Obras, etc.)
    selectedCategorias: editingFornecedor?.selectedCategorias || [],
    // Document uploads
    pacto_social: null,
    certificado_nao_devedor_agt: null,
    certificado_nao_devedor_inss: null,
    nif_proof: null,
    alvaras_comerciais: [], // Multiple files
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleMultipleFileChange = (e) => {
    const { files } = e.target;
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        alvaras_comerciais: [...prev.alvaras_comerciais, ...Array.from(files)],
      }));
    }
  };

  const handleRemoveAlvara = (index) => {
    setFormData((prev) => ({
      ...prev,
      alvaras_comerciais: prev.alvaras_comerciais.filter((_, i) => i !== index),
    }));
  };

  const handleCategoryToggle = (id) => {
    setFormData((prev) => {
      const categories = [...prev.categories];
      const index = categories.indexOf(id);
      if (index === -1) {
        categories.push(id);
      } else {
        categories.splice(index, 1);
      }
      return { ...prev, categories };
    });
  };

  const handleCategoriaFixaToggle = (catId) => {
    setFormData((prev) => {
      const selectedCategorias = [...prev.selectedCategorias];
      const index = selectedCategorias.indexOf(catId);
      if (index === -1) {
        selectedCategorias.push(catId);
      } else {
        selectedCategorias.splice(index, 1);
      }
      return { ...prev, selectedCategorias };
    });
    if (errors.selectedCategorias) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.selectedCategorias;
        return newErrors;
      });
    }
  };

  const handlePreviewFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewFile({ name: file.name, url, type: file.type });
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.legal_name) newErrors.legal_name = "Nome legal é obrigatório";
      if (!formData.commercial_name) newErrors.commercial_name = "Nome comercial é obrigatório";
      if (!formData.email) {
        newErrors.email = "Email é obrigatório";
      } else if (!formData.email.includes("@")) {
        newErrors.email = "Email deve conter '@' (ex: email@exemplo.ao)";
      }
      if (!formData.phone) newErrors.phone = "Telefone é obrigatório";
      if (!formData.nif) newErrors.nif = "NIF é obrigatório";
      if (formData.selectedCategorias.length === 0) {
        newErrors.selectedCategorias = "Selecione pelo menos uma categoria";
      }
    } else if (step === 2) {
      if (!formData.province) newErrors.province = "Província é obrigatória";
      if (!formData.municipality) newErrors.municipality = "Município é obrigatório";
      if (!formData.address) newErrors.address = "Endereço é obrigatório";
    } else if (step === 3) {
      if (!editingFornecedor) {
        if (!formData.nif_proof) newErrors.nif_proof = "Comprovativo NIF é obrigatório";
      }
      if (formData.categories.length === 0) newErrors.categories = "Selecione pelo menos uma categoria de fornecimento";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Debounced submit to prevent double-clicks and improve performance
  const handleSubmit = useCallback(async () => {
    if (submitRef.current) return; // Prevent double-submit
    if (!validateStep(3)) return;

    submitRef.current = true;
    setIsLoading(true);
    try {
      const data = new FormData();

      // Append all text fields
      data.append("legal_name", formData.legal_name);
      data.append("commercial_name", formData.commercial_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("nif", formData.nif);
      data.append("activity_type", formData.selectedCategorias.join(","));
      data.append("province", formData.province);
      data.append("municipality", formData.municipality);
      data.append("address", formData.address);

      // Append document files only if they exist
      if (formData.pacto_social) {
        data.append("pacto_social", formData.pacto_social);
      }
      if (formData.certificado_nao_devedor_agt) {
        data.append("certificado_nao_devedor_agt", formData.certificado_nao_devedor_agt);
      }
      if (formData.certificado_nao_devedor_inss) {
        data.append("certificado_nao_devedor_inss", formData.certificado_nao_devedor_inss);
      }
      if (formData.nif_proof) {
        data.append("nif_proof", formData.nif_proof);
      }
      // Multiple alvarás
      formData.alvaras_comerciais.forEach((file, index) => {
        data.append(`alvaras_comerciais[${index}]`, file);
      });

      // Append categories as array
      formData.categories.forEach((id) => {
        data.append("categories[]", id);
      });

      // Append selected categorias (Bens, Obras, etc.)
      formData.selectedCategorias.forEach((cat) => {
        data.append("categorias[]", cat);
      });

      console.log("Submitting formData...");

      if (editingFornecedor) {
        data.append("_method", "PUT");
        await suppliersAPI.updateMultipart(editingFornecedor.id, data);
      } else {
        await suppliersAPI.create(data);
      }

      setCurrentStep(4);
    } catch (err) {
      console.error("Error submitting form:", err);
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
        setToast({
          type: "error",
          message: err.response?.data?.message || "Erro de validação nos campos."
        });
      } else {
        setToast({ type: "error", message: "Erro de conexão ou servidor. Tente novamente." });
      }
    } finally {
      setIsLoading(false);
      submitRef.current = false;
    }
  }, [formData, editingFornecedor]);

  const provinces = ["Luanda", "Benguela", "Huambo", "Huíla", "Cabinda", "Namibe", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Bié", "Cunene", "Cuando Cubango", "Kwanza Norte", "Kwanza Sul", "Uíge", "Zaire", "Bengo"];
  const municipalities = ["Viana", "Luanda", "Cazenga", "Belas", "Talatona", "Lobito", "Benguela", "Kilamba Kiaxi", "Cacuaco", "Icolo e Bengo"];

  if (currentStep === 4) {
    return (
      <div className="h-screen bg-[#F8FDF9] flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-2xl text-center">
            <div className="w-24 h-24 bg-[#44B16F] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {editingFornecedor ? "Fornecedor atualizado!" : "Fornecedor cadastrado!"}
            </h2>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              O fornecedor <strong>{formData.commercial_name}</strong> foi {editingFornecedor ? "atualizado" : "adicionado"} com sucesso à sua base de dados.
            </p>
            <button
              onClick={() => navigate("/fornecedores")}
              className="px-12 py-4 bg-[#44B16F] text-white rounded-xl font-bold hover:bg-[#3a9d5f] transition-all transform hover:scale-105 shadow-xl"
            >
              Ir para Fornecedores
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FDF9] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{previewFile.name}</h3>
              <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50">
              {previewFile.type.startsWith("image/") ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
              ) : previewFile.type === "application/pdf" ? (
                <iframe src={previewFile.url} title={previewFile.name} className="w-full h-[60vh] rounded-lg" />
              ) : (
                <div className="text-center py-12">
                  <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Pré-visualização não disponível para este tipo de ficheiro.</p>
                  <a href={previewFile.url} download={previewFile.name} className="mt-4 inline-block px-6 py-2 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium">
                    Descarregar ficheiro
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white shadow-sm flex items-center justify-between">
        <button
          onClick={() => navigate("/AddFornecedorPage")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-medium group"
        >
          <div className="p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </div>
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-10">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep === step
                  ? "bg-[#44B16F] text-white shadow-md scale-110"
                  : currentStep > step
                    ? "bg-emerald-100 text-[#44B16F]"
                    : "bg-gray-100 text-gray-400"
                  }`}
              >
                {currentStep > step ? <CheckCircle size={20} /> : step}
              </div>
              <span
                className={`text-sm font-semibold transition-colors ${currentStep === step ? "text-gray-900" : "text-gray-400"
                  }`}
              >
                {step === 1 ? "Identificação" : step === 2 ? "Localização" : "Documentos"}
              </span>
              {step < 3 && <div className="w-12 h-0.5 bg-gray-200 ml-2" />}
            </div>
          ))}
        </div>
        <div className="w-24" /> {/* Spacer */}
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slideUp">
          <div className="p-10">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-6 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Dados da Empresa</h2>
                  <p className="text-gray-500">Informa os dados básicos de identificação do fornecedor.</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <InputField
                      label="Nome Legal *"
                      name="legal_name"
                      placeholder="Ex: Empresa de Exemplo, Lda"
                      value={formData.legal_name}
                      onChange={handleInputChange}
                      error={errors.legal_name}
                    />
                    <InputField
                      label="Nome Comercial *"
                      name="commercial_name"
                      placeholder="Ex: Exemplo Tech"
                      value={formData.commercial_name}
                      onChange={handleInputChange}
                      error={errors.commercial_name}
                    />

                    {/* Categoria (from API categories table) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Categoria *
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Selecione uma ou mais categorias</p>
                      <div className="flex flex-wrap gap-3">
                        {isLoadingCategories ? (
                          <p className="text-sm text-gray-400">Carregando categorias...</p>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategoriaFixaToggle(cat.id)}
                              className={`px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${formData.selectedCategorias.includes(cat.id)
                                ? "bg-[#44B16F]/10 border-[#44B16F] text-[#44B16F] shadow-sm"
                                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                            >
                              {formData.selectedCategorias.includes(cat.id) && (
                                <CheckCircle size={14} className="inline-block mr-1.5 -mt-0.5" />
                              )}
                              {cat.name}
                            </button>
                          ))
                        )}
                      </div>
                      {errors.selectedCategorias && (
                        <div className="flex items-center gap-1 mt-2 text-red-500 font-bold">
                          <AlertCircle size={14} />
                          <span className="text-xs">{errors.selectedCategorias}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <InputField
                      label="Email *"
                      name="email"
                      type="email"
                      placeholder="email@portal.ao"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                    />
                    <InputField
                      label="Telefone *"
                      name="phone"
                      placeholder="+244 9XX XXX XXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                    />
                    <InputField
                      label="NIF *"
                      name="nif"
                      placeholder="Número de Identificação Fiscal"
                      value={formData.nif}
                      onChange={handleInputChange}
                      error={errors.nif}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-6 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Localização</h2>
                  <p className="text-gray-500">Onde a empresa está sediada?</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Província *
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#44B16F] focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      >
                        {provinces.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Município *
                      </label>
                      <select
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#44B16F] focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      >
                        {municipalities.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Endereço Completo *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#44B16F] focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                        placeholder="Rua, Bairro, Edifício..."
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-2 font-bold">{errors.address}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-6 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Categorias e Documentos</h2>
                  <p className="text-gray-500">Complete as informações finais para o cadastro.</p>
                </div>

                <div className="space-y-6">
                  {/* Categories from API */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
                      Categorias de Fornecimento *
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {isLoadingCategories ? (
                        <p className="text-sm text-gray-400">Carregando categorias...</p>
                      ) : (
                        categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`px-6 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.categories.includes(cat.id)
                              ? "bg-[#44B16F]/10 border-[#44B16F] text-[#44B16F]"
                              : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                              }`}
                          >
                            {cat.name}
                          </button>
                        ))
                      )}
                    </div>
                    {(errors.categories || errors['categories.0']) && (
                      <p className="text-red-500 text-xs mt-2 font-bold">
                        {errors.categories || errors['categories.0']}
                      </p>
                    )}
                  </div>

                  {/* Document Uploads */}
                  <div className="pt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
                      Documentos (Anexos)
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                      <FileUploadField
                        label="Pacto Social"
                        name="pacto_social"
                        file={formData.pacto_social}
                        onChange={handleFileChange}
                        error={errors.pacto_social}
                        onPreview={handlePreviewFile}
                      />
                      <FileUploadField
                        label="Certificado de Não Devedor AGT"
                        name="certificado_nao_devedor_agt"
                        file={formData.certificado_nao_devedor_agt}
                        onChange={handleFileChange}
                        error={errors.certificado_nao_devedor_agt}
                        onPreview={handlePreviewFile}
                      />
                      <FileUploadField
                        label="Certificado de Não Devedor INSS"
                        name="certificado_nao_devedor_inss"
                        file={formData.certificado_nao_devedor_inss}
                        onChange={handleFileChange}
                        error={errors.certificado_nao_devedor_inss}
                        onPreview={handlePreviewFile}
                      />
                      <FileUploadField
                        label={`NIF ${editingFornecedor ? "" : "*"}`}
                        name="nif_proof"
                        file={formData.nif_proof}
                        onChange={handleFileChange}
                        error={errors.nif_proof}
                        onPreview={handlePreviewFile}
                      />
                    </div>

                    {/* Alvará Comercial - Multiple uploads */}
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Alvará Comercial
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Pode anexar mais de um alvará comercial</p>

                      <div className="flex flex-wrap gap-3 mb-3">
                        {formData.alvaras_comerciais.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 bg-emerald-50 border border-[#44B16F]/30 px-3 py-2 rounded-xl">
                            <FileText size={16} className="text-[#44B16F]" />
                            <span className="text-xs font-bold text-[#44B16F] max-w-[150px] truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(file)}
                              className="p-1 hover:bg-[#44B16F]/10 rounded transition-colors"
                              title="Pré-visualizar"
                            >
                              <Eye size={14} className="text-[#44B16F]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAlvara(index)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <X size={14} className="text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-gray-50 border-gray-200 hover:border-[#44B16F]">
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleMultipleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <Upload className="text-gray-400 mb-3" size={28} />
                        <p className="text-xs font-bold text-gray-500">Clique para carregar alvará(s)</p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-10 py-8 bg-gray-50 flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? () => navigate("/AddFornecedorPage") : prevStep}
              className="px-8 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors uppercase tracking-widest text-xs"
            >
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </button>
            <button
              onClick={currentStep === 3 ? handleSubmit : nextStep}
              disabled={isLoading}
              className={`px-12 py-4 bg-[#44B16F] text-white rounded-xl font-bold hover:bg-[#3a9d5f] transition-all shadow-lg flex items-center gap-3 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {currentStep === 3 ? "Finalizar Cadastro" : "Próximo Passo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", placeholder, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-medium ${error ? "border-red-500 bg-red-50" : "border-transparent focus:border-[#44B16F] focus:bg-white"
          }`}
      />
      {error && (
        <div className="flex items-center gap-1 mt-2 text-red-500 font-bold">
          <AlertCircle size={14} />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}

function FileUploadField({ label, name, file, onChange, error, onPreview }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <label
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${file
          ? "bg-emerald-50 border-[#44B16F]"
          : error
            ? "bg-red-50 border-red-500"
            : "bg-gray-50 border-gray-200 hover:border-[#44B16F]"
          }`}
      >
        <input type="file" name={name} className="hidden" onChange={onChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        {file ? (
          <>
            <div className="w-12 h-12 bg-[#44B16F] text-white rounded-full flex items-center justify-center mb-3">
              <CheckCircle size={24} />
            </div>
            <p className="text-xs font-bold text-[#44B16F] text-center truncate w-full px-2">
              {file.name}
            </p>
          </>
        ) : (
          <>
            <Upload className={`mb-3 ${error ? "text-red-400" : "text-gray-400"}`} size={28} />
            <p className={`text-xs font-bold ${error ? "text-red-400" : "text-gray-500"}`}>
              Clique para carregar
            </p>
          </>
        )}
      </label>
      {file && onPreview && (
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#44B16F] hover:text-[#3a9d5f] transition-colors"
        >
          <Eye size={14} />
          Pré-visualizar
        </button>
      )}
      {error && <p className="text-red-500 text-[10px] mt-1 font-bold">{error}</p>}
    </div>
  );
}