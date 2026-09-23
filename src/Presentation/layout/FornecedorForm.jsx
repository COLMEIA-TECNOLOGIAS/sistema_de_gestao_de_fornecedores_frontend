import { ArrowLeft, AlertCircle, FileText, CheckCircle, Upload, X, Eye, Plus } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { suppliersAPI, categoriesAPI } from "../../services/api";
import Toast from "../Components/Toast";
import { PROVINCE_NAMES, getMunicipalities } from "../../utils/angolaLocations";

// Categories are now fetched from the API
// As províncias e municípios vêm do dataset local (angolaLocations.js)

export default function FornecedorFormWrapper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const editingFornecedor = location.state?.fornecedor || null;
  const submitRef = useRef(false); // Prevent double-submit

  // Documentos existentes marcados para eliminação/substituição
  const [removedDocuments, setRemovedDocuments] = useState([]);
  const [removedLicenses, setRemovedLicenses] = useState([]);

  const handleRemoveExistingDocument = (type) => {
    setRemovedDocuments(prev => (prev.includes(type) ? prev : [...prev, type]));
  };

  const handleRemoveExistingLicense = (index) => {
    setRemovedLicenses(prev => (prev.includes(index) ? prev : [...prev, index]));
  };

  // Detect existing uploaded documents (for the edit flow)
  const existingDocuments = (() => {
    const f = editingFornecedor;
    if (!f) return {};
    const first = (...keys) => {
      for (const k of keys) {
        const v = f[k];
        if (typeof v === 'string' && v) return v;
      }
      return null;
    };
    const licenses = (() => {
      const raw = f.commercial_license_url || f.commercial_license;
      if (Array.isArray(raw)) return raw.filter(v => typeof v === 'string' && v);
      if (typeof raw === 'string' && raw) return [raw];
      return [];
    })();
    return {
      commercial_certificate: first('commercial_certificate_url', 'commercial_certificate'),
      pacto_social: first('pacto_social_url', 'pacto_social'),
      agt_certificate: first('agt_certificate_url', 'agt_certificate', 'non_debtor_certificate_agt_url', 'non_debtor_certificate_agt'),
      inss_certificate: first('inss_certificate_url', 'inss_certificate', 'non_debtor_certificate_inss_url', 'non_debtor_certificate_inss'),
      nif_proof: first('nif_proof_url', 'nif_proof'),
      product_list: first('product_list_url', 'product_list'),
      licenses,
    };
  })();

  const handleViewExistingDocument = async (type, index) => {
    if (!editingFornecedor) return;

    // Alguns documentos podem ser armazenados com nomes de tipo diferentes —
    // tentamos todas as variantes conhecidas até uma responder.
    const candidates = (type === 'agt_certificate' || type === 'non_debtor_certificate_agt')
      ? ['agt_certificate', 'non_debtor_certificate_agt']
      : (type === 'inss_certificate' || type === 'non_debtor_certificate_inss')
        ? ['inss_certificate', 'non_debtor_certificate_inss']
        : [type];

    for (const candidate of candidates) {
      try {
        const params = index !== undefined ? { index } : {};
        const response = await suppliersAPI.getDocument(editingFornecedor.id, candidate, params);
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const objectUrl = window.URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
        return;
      } catch (error) {
        console.warn(`Documento não disponível como "${candidate}":`, error);
      }
    }
    alert("Erro ao carregar o documento.");
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await categoriesAPI.getAll();
        setCategories(Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []));
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
    company_name: editingFornecedor?.company_name || editingFornecedor?.commercial_name || "",
    email: editingFornecedor?.email || "",
    phone: editingFornecedor?.phone || "",
    nif: editingFornecedor?.nif || "",
    province: editingFornecedor?.province || "Luanda",
    municipality: editingFornecedor?.municipality || "Viana",
    address: editingFornecedor?.address || "",
    categories: editingFornecedor?.categories?.map(c => c.id) || [],
    alt_phone: editingFornecedor?.alt_phone || "",
    // Document uploads
    pacto_social: null,
    commercial_certificate: null,
    non_debtor_certificate_agt: null,
    non_debtor_certificate_inss: null,
    nif_proof: null,
    product_list: null,
    commercial_licenses: [], // Multiple files
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "province") {
        newData.municipality = "";
      }
      return newData;
    });
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
        commercial_licenses: [...prev.commercial_licenses, ...Array.from(files)],
      }));
    }
  };

  const handleRemoveAlvara = (index) => {
    setFormData((prev) => ({
      ...prev,
      commercial_licenses: prev.commercial_licenses.filter((_, i) => i !== index),
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsSubmittingCategory(true);
      const res = await categoriesAPI.create({ name: newCategoryName });
      const created = res.data || res;
      setCategories(prev => [...prev, created]);
      handleCategoryToggle(created.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      setToast({ type: 'success', message: 'Categoria criada com sucesso' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Erro ao criar categoria' });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

    // handleCategoriaFixaToggle removed

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
      if (!formData.company_name) newErrors.company_name = "Nome da Empresa é obrigatório";
      if (!formData.email) {
        newErrors.email = "Email é obrigatório";
      } else if (!formData.email.includes("@")) {
        newErrors.email = "Email deve conter '@' (ex: email@exemplo.ao)";
      }
      if (!formData.phone) newErrors.phone = "Telefone é obrigatório";
      if (!formData.nif) newErrors.nif = "NIF é obrigatório";
      if (formData.categories.length === 0) {
        newErrors.categories = "Selecione pelo menos uma categoria";
      }
    } else if (step === 2) {
      if (!formData.province) newErrors.province = "Província é obrigatória";
      if (!formData.municipality) newErrors.municipality = "Município é obrigatório";
      if (!formData.address) newErrors.address = "Endereço é obrigatório";
    } else if (step === 3) {
      if (!editingFornecedor) {
        if (!formData.nif_proof) newErrors.nif_proof = "Comprovativo NIF é obrigatório";
        if (!formData.commercial_certificate) newErrors.commercial_certificate = "Certificado Comercial é obrigatório";
      }
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
      data.append("company_name", formData.company_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      if (formData.alt_phone) data.append("alt_phone", formData.alt_phone);
      data.append("nif", formData.nif);
      data.append("province", formData.province);
      data.append("municipality", formData.municipality);
      data.append("address", formData.address);
      data.append("activity_type", ""); // Send as empty string so backend sets it to null

      // Append document files only if they exist
      if (formData.pacto_social) {
        data.append("pacto_social", formData.pacto_social);
      }
      if (formData.commercial_certificate) {
        data.append("commercial_certificate", formData.commercial_certificate);
      }
      if (formData.non_debtor_certificate_agt) {
        data.append("non_debtor_certificate_agt", formData.non_debtor_certificate_agt);
      }
      if (formData.non_debtor_certificate_inss) {
        data.append("non_debtor_certificate_inss", formData.non_debtor_certificate_inss);
      }
      if (formData.nif_proof instanceof File) {
        data.append("nif_proof", formData.nif_proof);
      }
      if (formData.product_list) {
        data.append("product_list", formData.product_list);
      }
      // Multiple alvarás - Some backends expect repeated keys without []
      if (formData.commercial_licenses && formData.commercial_licenses.length > 0) {
        formData.commercial_licenses.forEach((file) => {
          if (file instanceof File) {
            data.append("commercial_license", file);
          }
        });
      }

      // Append categories as array (Laravel compatible format)
      formData.categories.forEach((id, index) => {
        data.append(`categories[${index}]`, id);
      });

      if (editingFornecedor) {
        data.append("_method", "PUT");
        await suppliersAPI.updateMultipart(editingFornecedor.id, data);

        // Eliminar no servidor os documentos marcados com X (best-effort)
        for (const type of removedDocuments) {
          try {
            const [docType, query] = type.split('&');
            const params = query && query.startsWith('index=') ? { index: query.split('=')[1] } : {};
            await api.delete(`/suppliers/${editingFornecedor.id}/documents/${docType}`, { params });
          } catch (delErr) {
            console.warn("Falha ao eliminar documento no servidor:", delErr);
          }
        }
        for (const index of removedLicenses) {
          try {
            await api.delete(`/suppliers/${editingFornecedor.id}/documents/commercial_license`, { params: { index } });
          } catch (delErr) {
            console.warn("Falha ao eliminar alvará no servidor:", delErr);
          }
        }
      } else {
        await suppliersAPI.create(data);
      }

      setCurrentStep(4);
    } catch (err) {
      console.error("Error submitting form:", err);
      console.error("Response status:", err.response?.status);
      console.error("Response data:", JSON.stringify(err.response?.data, null, 2));

      const status = err.response?.status;
      const responseData = err.response?.data;

      if (responseData?.errors) {
        // Validation errors (Laravel 422)
        setErrors(responseData.errors);
        setToast({
          type: "error",
          message: responseData.message || "Erro de validação nos campos."
        });
      } else if (responseData?.message) {
        // API returned a message but no field errors
        setToast({
          type: "error",
          message: `Erro ${status || ''}: ${responseData.message}`
        });
      } else if (!err.response) {
        // Network error (no response at all)
        setToast({ type: "error", message: "Sem resposta do servidor. Verifique a sua ligação à internet." });
      } else {
        setToast({ type: "error", message: `Erro ${status || 'desconhecido'} do servidor. Contacte o suporte.` });
      }
    } finally {
      setIsLoading(false);
      submitRef.current = false;
    }
  }, [formData, editingFornecedor, removedDocuments, removedLicenses]);

const provinces = PROVINCE_NAMES;

  const municipalities = useMemo(
    () => getMunicipalities(formData.province),
    [formData.province]
  );

  if (currentStep === 4) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-2xl text-center">
            <div className="w-24 h-24 bg-[#44B16F] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {editingFornecedor ? "Fornecedor atualizado!" : "Fornecedor cadastrado!"}
            </h2>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              O fornecedor <strong>{formData.company_name}</strong> foi {editingFornecedor ? "atualizado" : "adicionado"} com sucesso à sua base de dados.
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
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
          onClick={() => navigate("/fornecedores")}
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
                      label="Nome da Empresa *"
                      name="company_name"
                      placeholder="Ex: Empresa de Exemplo, Lda"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      error={errors.company_name}
                    />
                    
                    <InputField
                      label="NIF *"
                      name="nif"
                      placeholder="Número de Identificação Fiscal"
                      value={formData.nif}
                      onChange={handleInputChange}
                      error={errors.nif}
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
                          <>
                            {categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryToggle(cat.id)}
                                className={`px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${formData.categories.includes(cat.id)
                                  ? "bg-[#44B16F]/10 border-[#44B16F] text-[#44B16F] shadow-sm"
                                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                  }`}
                              >
                                {formData.categories.includes(cat.id) && (
                                  <CheckCircle size={14} className="inline-block mr-1.5 -mt-0.5" />
                                )}
                                {cat.name}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                      {errors.categories && (
                        <div className="flex items-center gap-1 mt-2 text-red-500 font-bold">
                          <AlertCircle size={14} />
                          <span className="text-xs">{errors.categories}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email *</label>
                        <input
                            type="email"
                            placeholder="email@portal.ao"
                            value={formData.email}
                            onChange={(e) => {
                                let val = e.target.value.replace(/\s/g, '');
                                setFormData(prev => ({...prev, email: val}));
                                if (val && !val.includes('@')) {
                                    setErrors(prev => ({...prev, email: "Email inválido (faltando @)"}));
                                } else {
                                    setErrors(prev => { const n = {...prev}; delete n.email; return n; });
                                }
                            }}
                            className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-medium ${errors.email ? "border-red-500 bg-red-50" : "border-transparent focus:border-[#44B16F] focus:bg-white"}`}
                        />
                        {errors.email && <div className="flex items-center gap-1 mt-2 text-red-500 font-bold"><AlertCircle size={14}/><span className="text-xs">{errors.email}</span></div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Telefone *</label>
                            <div className="flex items-center bg-gray-50 border-2 rounded-2xl focus-within:border-[#44B16F] focus-within:bg-white transition-all overflow-hidden" style={errors.phone ? {borderColor: 'rgb(239 68 68)', backgroundColor: 'rgb(254 242 242)'} : {}}>
                                <span className="px-4 text-gray-500 font-medium border-r border-gray-200">+244</span>
                                <input
                                    type="text"
                                    placeholder="9XX XXX XXX"
                                    value={formData.phone}
                                    maxLength="9"
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({...prev, phone: val}));
                                        setErrors(prev => { const n = {...prev}; delete n.phone; return n; });
                                    }}
                                    className="w-full py-4 px-3 bg-transparent outline-none font-medium"
                                />
                            </div>
                            {errors.phone && <div className="flex items-center gap-1 mt-2 text-red-500 font-bold"><AlertCircle size={14}/><span className="text-xs">{errors.phone}</span></div>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Telefone 2</label>
                            <div className="flex items-center bg-gray-50 border-2 rounded-2xl focus-within:border-[#44B16F] focus-within:bg-white transition-all overflow-hidden">
                                <span className="px-4 text-gray-500 font-medium border-r border-gray-200">+244</span>
                                <input
                                    type="text"
                                    placeholder="Opcional"
                                    value={formData.alt_phone}
                                    maxLength="9"
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({...prev, alt_phone: val}));
                                    }}
                                    className="w-full py-4 px-3 bg-transparent outline-none font-medium"
                                />
                            </div>
                        </div>
                    </div>
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
                        <option value="">Selecione uma província...</option>
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
                        disabled={!formData.province}
                        className={`w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#44B16F] focus:bg-white rounded-2xl outline-none transition-all font-medium ${!formData.province ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Selecione um município...</option>
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Documentos</h2>
                  <p className="text-gray-500">Complete as informações finais para o cadastro.</p>
                </div>

                <div className="space-y-6">
                  {/* Document Uploads */}
                  <div className="pt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
                      Documentos (Anexos)
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                      <FileUploadField
                        label="Certificado Comercial"
                        required={!editingFornecedor}
                        name="commercial_certificate"
                        file={formData.commercial_certificate}
                        onChange={handleFileChange}
                        error={errors.commercial_certificate}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.commercial_certificate}
                        existingDocType="commercial_certificate"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('commercial_certificate')}
                        helperText="Formato PDF (.pdf)"
                        accept=".pdf"
                      />
                      <FileUploadField
                        label="Pacto Social"
                        name="pacto_social"
                        file={formData.pacto_social}
                        onChange={handleFileChange}
                        error={errors.pacto_social}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.pacto_social}
                        existingDocType="pacto_social"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('pacto_social')}
                        helperText="Formato PDF (.pdf)"
                        accept=".pdf"
                      />
                      <FileUploadField
                        label="Certificado de Não Devedor AGT"
                        name="non_debtor_certificate_agt"
                        file={formData.non_debtor_certificate_agt}
                        onChange={handleFileChange}
                        error={errors.non_debtor_certificate_agt}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.agt_certificate}
                        existingDocType="agt_certificate"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('agt_certificate')}
                        helperText="PDF, JPG ou PNG (máx 5MB) — Opcional"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <FileUploadField
                        label="Certificado de Não Devedor INSS"
                        name="non_debtor_certificate_inss"
                        file={formData.non_debtor_certificate_inss}
                        onChange={handleFileChange}
                        error={errors.non_debtor_certificate_inss}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.inss_certificate}
                        existingDocType="inss_certificate"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('inss_certificate')}
                        helperText="PDF, JPG ou PNG (máx 5MB) — OPCIONAL"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <FileUploadField
                        label="Comprovativo NIF"
                        required={!editingFornecedor}
                        name="nif_proof"
                        file={formData.nif_proof}
                        onChange={handleFileChange}
                        error={errors.nif_proof}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.nif_proof}
                        existingDocType="nif_proof"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('nif_proof')}
                        helperText="Formato PDF (.pdf)"
                        accept=".pdf"
                      />
                      <FileUploadField
                        label="Lista de Produtos"
                        name="product_list"
                        file={formData.product_list}
                        onChange={handleFileChange}
                        error={errors.product_list}
                        onPreview={handlePreviewFile}
                        existingDoc={existingDocuments.product_list}
                        existingDocType="product_list"
                        onViewExisting={handleViewExistingDocument}
                        onRemoveExisting={handleRemoveExistingDocument}
                        existingRemoved={removedDocuments.includes('product_list')}
                        helperText="Documento com a lista de produtos (PDF)"
                        accept=".pdf"
                      />
                    </div>

                    {/* Alvará Comercial - Multiple uploads */}
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Alvará Comercial
                      </label>
                      <p className="text-xs text-gray-500 mb-3">Pode anexar mais de um alvará comercial</p>

                      <div className="flex flex-wrap gap-3 mb-3">
                        {existingDocuments.licenses && existingDocuments.licenses.length > 0 && (
                          existingDocuments.licenses.map((lic, index) => (
                            !removedLicenses.includes(index) && (
                              <div key={`existing-${index}`} className="flex items-center gap-2 bg-emerald-50 border border-[#44B16F]/30 px-3 py-2 rounded-xl">
                                <FileText size={16} className="text-[#44B16F]" />
                                <span className="text-xs font-bold text-[#44B16F] max-w-[150px] truncate">Alvará {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleViewExistingDocument('commercial_license', index)}
                                  className="p-1 hover:bg-[#44B16F]/10 rounded transition-colors"
                                  title="Ver"
                                >
                                  <Eye size={14} className="text-[#44B16F]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExistingLicense(index)}
                                  className="p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar alvará"
                                >
                                  <X size={14} className="text-red-500" />
                                </button>
                              </div>
                            )
                          ))
                        )}
                        {formData.commercial_licenses.map((file, index) => (
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
                          accept=".pdf"
                        />
                        <Upload className="text-gray-400 mb-3" size={28} />
                        <p className="text-xs font-bold text-gray-500">Clique para carregar alvará(s) - Formato PDF</p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-10 py-8 bg-gray-50 flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? () => navigate("/fornecedores") : prevStep}
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

function FileUploadField({ label, name, file, onChange, error, onPreview, required, helperText, accept = ".pdf", existingDoc, existingDocType, onViewExisting, onRemoveExisting, existingRemoved }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
        {label}
        {required && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px]">Obrigatório</span>}
      </label>
      {!file && existingDoc && !existingRemoved && (
        <div className="flex items-center justify-between gap-2 mb-2 bg-emerald-50 border border-[#44B16F]/30 px-3 py-2 rounded-xl">
          <span className="text-xs font-bold text-[#44B16F] truncate">Documento carregado</span>
          <div className="flex items-center gap-1 shrink-0">
            {onViewExisting && existingDocType && (
              <button
                type="button"
                onClick={() => onViewExisting(existingDocType)}
                className="flex items-center gap-1 text-xs font-bold text-[#44B16F] hover:underline"
              >
                <Eye size={14} />
                Ver
              </button>
            )}
            {onRemoveExisting && existingDocType && (
              <button
                type="button"
                onClick={() => onRemoveExisting(existingDocType)}
                title="Eliminar documento"
                className="p-1 rounded hover:bg-red-50 transition-colors"
              >
                <X size={14} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
      )}
      {!file && existingDoc && existingRemoved && (
        <div className="flex items-center gap-2 mb-2 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <X size={14} className="text-red-500" />
          <span className="text-xs font-bold text-red-500">Documento removido — carregue um novo para substituir, se desejar.</span>
        </div>
      )}
      <label
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${file
          ? "bg-emerald-50 border-[#44B16F]"
          : error
            ? "bg-red-50 border-red-500"
            : "bg-gray-50 border-gray-200 hover:border-[#44B16F]"
          }`}
      >
        <input type="file" name={name} className="hidden" onChange={onChange} accept={accept} />
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
            {helperText && <p className="text-[10px] text-gray-400 mt-1 font-medium">{helperText}</p>}
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