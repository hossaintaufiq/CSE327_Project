"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Building2,
  Package,
  HelpCircle,
  AlertCircle,
  Headphones,
  ArrowLeft,
  Search,
  ChevronRight,
  Loader2,
  Send,
  Bot,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import useAuthStore from "@/store/authStore";
import api from "@/utils/api";

const conversationTypes = [
  { id: "inquiry", label: "Product Inquiry", description: "Ask about products or services", icon: HelpCircle, color: "blue" },
  { id: "order", label: "Order Related", description: "Questions about existing orders", icon: Package, color: "green" },
  { id: "complaint", label: "File a Complaint", description: "Report an issue or problem", icon: AlertCircle, color: "red" },
  { id: "support", label: "Technical Support", description: "Get help with technical issues", icon: Headphones, color: "purple" },
  { id: "general", label: "General Inquiry", description: "Other questions", icon: MessageSquare, color: "gray" },
];

export default function NewConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      fetchCompanies();
      
      // Pre-select company if provided in URL
      const companyId = searchParams.get("company");
      if (companyId) {
        setStep(2);
      }
    }
  }, [isAuthenticated, authLoading]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/companies");
      setCompanies(res.data.data || []);
      
      // Check if company was pre-selected
      const companyId = searchParams.get("company");
      if (companyId) {
        const company = res.data.data?.find(c => c._id === companyId);
        if (company) {
          setSelectedCompany(company);
          setStep(2);
          fetchProducts(companyId);
        }
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      // Mock data
      const mockCompanies = [
        { _id: "1", name: "TechCorp Solutions", industry: "Technology", logo: null },
        { _id: "2", name: "Global Supplies Inc", industry: "Manufacturing", logo: null },
        { _id: "3", name: "Digital Marketing Pro", industry: "Marketing", logo: null },
      ];
      setCompanies(mockCompanies);
      
      const companyId = searchParams.get("company");
      if (companyId) {
        const company = mockCompanies.find(c => c._id === companyId);
        if (company) {
          setSelectedCompany(company);
          setStep(2);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (companyId) => {
    try {
      const res = await api.get(`/companies/${companyId}/products`);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      // Mock products
      setProducts([
        { _id: "p1", name: "Enterprise CRM", category: "Software" },
        { _id: "p2", name: "Cloud Hosting", category: "Services" },
        { _id: "p3", name: "Data Analytics", category: "Software" },
      ]);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    fetchProducts(company._id);
    setStep(2);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep(3);
  };

  const handleCreateConversation = async () => {
    if (!selectedCompany || !selectedType || !initialMessage.trim()) return;

    setCreating(true);
    try {
      const res = await api.post("/conversations", {
        companyId: selectedCompany._id,
        conversationType: selectedType.id,
        productId: selectedProduct?._id,
        subject: subject || `${selectedType.label} - ${selectedCompany.name}`,
        initialMessage: initialMessage.trim(),
      });

      if (res.data.data?._id) {
        router.push(`/conversations?id=${res.data.data._id}`);
      } else {
        router.push("/conversations");
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      // Demo: redirect anyway
      router.push("/conversations");
    } finally {
      setCreating(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  router.push("/conversations");
                }
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Conversation</h1>
              <p className="text-gray-500">Start a conversation with a company</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                <span className={`text-sm ${step >= s ? "text-gray-900" : "text-gray-400"}`}>
                  {s === 1 ? "Company" : s === 2 ? "Type" : "Message"}
                </span>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Company */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Company</h2>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                {filteredCompanies.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => handleSelectCompany(company)}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {company.name?.charAt(0) || "C"}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </button>
                ))}

                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No companies found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Conversation Type */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedCompany?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedCompany?.name}</h3>
                  <p className="text-sm text-gray-500">{selectedCompany?.industry}</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">What would you like to discuss?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversationTypes.map((type) => {
                  const Icon = type.icon;
                  const colorClasses = {
                    blue: "hover:border-blue-500 hover:bg-blue-50",
                    green: "hover:border-green-500 hover:bg-green-50",
                    red: "hover:border-red-500 hover:bg-red-50",
                    purple: "hover:border-purple-500 hover:bg-purple-50",
                    gray: "hover:border-gray-400 hover:bg-gray-50",
                  };
                  const iconColorClasses = {
                    blue: "bg-blue-100 text-blue-600",
                    green: "bg-green-100 text-green-600",
                    red: "bg-red-100 text-red-600",
                    purple: "bg-purple-100 text-purple-600",
                    gray: "bg-gray-100 text-gray-600",
                  };
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className={`flex items-start gap-4 p-4 border border-gray-200 rounded-lg transition-all ${colorClasses[type.color]}`}
                    >
                      <div className={`p-3 rounded-lg ${iconColorClasses[type.color]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{type.label}</h3>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Product Selection (Optional) */}
              {products.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Related to a specific product? (Optional)</h3>
                  <div className="flex flex-wrap gap-2">
                    {products.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => setSelectedProduct(selectedProduct?._id === product._id ? null : product)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          selectedProduct?._id === product._id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Write Message */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Summary */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedCompany?.name?.charAt(0) || "C"}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedCompany?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <selectedType.icon className="w-4 h-4" />
                    <span>{selectedType?.label}</span>
                    {selectedProduct && (
                      <>
                        <span>•</span>
                        <span>{selectedProduct.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI-Powered Support</h4>
                  <p className="text-sm text-gray-600">
                    Your conversation will start with our AI assistant. You can request a human representative at any time.
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`${selectedType?.label} - ${selectedCompany?.name}`}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe what you need help with..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleCreateConversation}
                disabled={!initialMessage.trim() || creating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Conversation...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Start Conversation
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
