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
  const { user } = useAuthStore();
  
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
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    fetchCompanies();
    
    // Pre-select company if provided in URL
    const companyId = searchParams.get("company");
    if (companyId) {
      setStep(2);
    }
  }, [mounted]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/conversations/browse-companies");
      setCompanies(res.data.data?.companies || []);
      
      // Check if company was pre-selected
      const companyId = searchParams.get("company");
      if (companyId) {
        const company = res.data.data?.companies?.find(c => c._id === companyId);
        if (company) {
          setSelectedCompany(company);
          setStep(2);
          fetchProducts(companyId);
        }
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      // No fallback to mock data - show empty state
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (companyId) => {
    try {
      const res = await api.get(`/company/${companyId}/products`);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      // Products are optional
      setProducts([]);
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
      const res = await api.post("/conversations/start", {
        companyId: selectedCompany._id,
        type: selectedType.id,
        productId: selectedProduct?._id,
        productName: selectedProduct?.name,
        initialMessage: initialMessage.trim(),
      });

      if (res.data.data?.conversation?._id) {
        router.push(`/conversations?id=${res.data.data.conversation._id}`);
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
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
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">New Conversation</h1>
              <p className="text-gray-400">Start a conversation with a company</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {s}
                </div>
                <span className={`text-sm ${step >= s ? "text-white" : "text-gray-500"}`}>
                  {s === 1 ? "Company" : s === 2 ? "Type" : "Message"}
                </span>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-700"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Company */}
          {step === 1 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Select a Company</h2>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                {filteredCompanies.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => handleSelectCompany(company)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700 transition-all group"
                  >
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {company.name?.charAt(0) || "C"}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-white">{company.name}</h3>
                      <p className="text-sm text-gray-400">{company.industry}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400" />
                  </button>
                ))}

                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No companies found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Conversation Type */}
          {step === 2 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedCompany?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="font-medium text-white">{selectedCompany?.name}</h3>
                  <p className="text-sm text-gray-400">{selectedCompany?.industry}</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-white mb-4">What would you like to discuss?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversationTypes.map((type) => {
                  const Icon = type.icon;
                  const colorClasses = {
                    blue: "hover:border-blue-500 hover:bg-blue-500/10",
                    green: "hover:border-green-500 hover:bg-green-500/10",
                    red: "hover:border-red-500 hover:bg-red-500/10",
                    purple: "hover:border-purple-500 hover:bg-purple-500/10",
                    gray: "hover:border-gray-500 hover:bg-gray-500/10",
                  };
                  const iconColorClasses = {
                    blue: "bg-blue-500/20 text-blue-400",
                    green: "bg-green-500/20 text-green-400",
                    red: "bg-red-500/20 text-red-400",
                    purple: "bg-purple-500/20 text-purple-400",
                    gray: "bg-gray-500/20 text-gray-400",
                  };
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className={`flex items-start gap-4 p-4 bg-gray-700/50 border border-gray-600 rounded-lg transition-all ${colorClasses[type.color]}`}
                    >
                      <div className={`p-3 rounded-lg ${iconColorClasses[type.color]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">{type.label}</h3>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Product Selection (Optional) */}
              {products.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Related to a specific product? (Optional)</h3>
                  <div className="flex flex-wrap gap-2">
                    {products.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => setSelectedProduct(selectedProduct?._id === product._id ? null : product)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          selectedProduct?._id === product._id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              {/* Summary */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {selectedCompany?.name?.charAt(0) || "C"}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">{selectedCompany?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
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
              <div className="bg-linear-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 border border-purple-500/20">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">AI-Powered Support</h4>
                  <p className="text-sm text-gray-400">
                    Your conversation will start with our AI assistant. You can request a human representative at any time.
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`${selectedType?.label} - ${selectedCompany?.name}`}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Message
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe what you need help with..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
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
