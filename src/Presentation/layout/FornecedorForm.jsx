import { ArrowLeft, AlertCircle, FileText, CheckCircle, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { suppliersAPI, categoriesAPI } from "../../services/api";
import Toast from "../Components/Toast";

export default function FornecedorFormWrapper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const editingFornecedor = location.state?.fornecedor || null;

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
    activity_type: editingFornecedor?.activity_type || "product",
    province: editingFornecedor?.province || "Luanda",
    municipality: editingFornecedor?.municipality || "Viana",
    address: editingFornecedor?.address || "",
    categories: editingFornecedor?.categories?.map(c => c.id) || [], // Assuming it comes populated or we need strict IDs if it's a relation
    commercial_certificate: null,
    commercial_license: null,
    nif_proof: null,
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

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.legal_name) newErrors.legal_name = "Nome legal é obrigatório";
      if (!formData.commercial_name) newErrors.commercial_name = "Nome comercial é obrigatório";
      if (!formData.email) newErrors.email = "Email é obrigatório";
      if (!formData.phone) newErrors.phone = "Telefone é obrigatório";
      if (!formData.nif) newErrors.nif = "NIF é obrigatório";
    } else if (step === 2) {
      if (!formData.province) newErrors.province = "Província é obrigatória";
      if (!formData.municipality) newErrors.municipality = "Município é obrigatório";
      if (!formData.address) newErrors.address = "Endereço é obrigatório";
    } else if (step === 3) {
      // Documents are mandatory only for new registrations
      if (!editingFornecedor) {
        if (!formData.commercial_certificate) newErrors.commercial_certificate = "Certificado comercial é obrigatório";
        if (!formData.nif_proof) newErrors.nif_proof = "Comprovativo NIF é obrigatório";
      }
      if (formData.categories.length === 0) newErrors.categories = "Selecione pelo menos uma categoria";
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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      // Use FormData for file uploads
      const data = new FormData();

      // Append all text fields
      data.append("legal_name", formData.legal_name);
      data.append("commercial_name", formData.commercial_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("nif", formData.nif);
      data.append("activity_type", formData.activity_type);
      data.append("province", formData.province);
      data.append("municipality", formData.municipality);
      data.append("address", formData.address);

      // Append files only if they exist
      if (formData.commercial_certificate) {
        data.append("commercial_certificate", formData.commercial_certificate);
      }
      if (formData.commercial_license) {
        data.append("commercial_license", formData.commercial_license);
      }
      if (formData.nif_proof) {
        data.append("nif_proof", formData.nif_proof);
      }

      // Append categories as array
      formData.categories.forEach((id) => {
        data.append("categories[]", id);
      });

      console.log("Submitting formData...");

      if (editingFornecedor) {
        // If editing, we might need a distinct update method or just use a PUT compatible approach
        // Usually laravel/php backend with multipart/form-data requires _method=PUT or POST to a specific endpoint
        // Let's assume standard PUT via API wrapper if available, or POST with _method
        // For now, using suppliersAPI.update(id, data).
        // Note: If using axios with FormData, PUT often fails to parse body in PHP without workarounds.
        // A safer bet is POST with _method=PUT for PHP backends if standard PUT fails.
        // I'll try standard update first as requested "já tem o metodo editar na api".
        data.append("_method", "PUT"); // Just in case it's Laravel
        await suppliersAPI.update(editingFornecedor.id, data);
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
    }
  };

  const provinces = ["Luanda", "Benguela", "Huambo", "Huíla", "Cabinda", "Namibe"];
  const municipalities = ["Viana", "Luanda", "Cazenga", "Belas", "Talatona", "Lobito"];

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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Tipo de Atividade *
                      </label>
                      <div className="flex gap-4 p-1 bg-gray-50 rounded-xl">
                        {["product", "service"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, activity_type: type })}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formData.activity_type === type
                              ? "bg-white text-[#44B16F] shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            {type === "product" ? "Produto" : "Serviço"}
                          </button>
                        ))}
                      </div>
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

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <FileUploadField
                      label={`Certificado Comercial ${editingFornecedor ? "" : "*"}`}
                      name="commercial_certificate"
                      file={formData.commercial_certificate}
                      onChange={handleFileChange}
                      error={errors.commercial_certificate}
                    />
                    <FileUploadField
                      label="Alvará Comercial"
                      name="commercial_license"
                      file={formData.commercial_license}
                      onChange={handleFileChange}
                      error={errors.commercial_license}
                    />
                    <FileUploadField
                      label={`Comprovativo NIF ${editingFornecedor ? "" : "*"}`}
                      name="nif_proof"
                      file={formData.nif_proof}
                      onChange={handleFileChange}
                      error={errors.nif_proof}
                    />
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

function FileUploadField({ label, name, file, onChange, error }) {
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
        <input type="file" name={name} className="hidden" onChange={onChange} />
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
      {error && <p className="text-red-500 text-[10px] mt-1 font-bold">{error}</p>}
    </div>
  );
}