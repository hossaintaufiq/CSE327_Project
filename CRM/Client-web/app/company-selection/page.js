"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/utils/api";
import useAuthStore from "@/store/authStore";

export default function CompanySelectionPage() {
  const router = useRouter();
  const { user, companies, setUser, setActiveCompany, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [joiningCompany, setJoiningCompany] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    companyName: "",
    domain: "",
  });
  const [joinFormData, setJoinFormData] = useState({
    companyName: "",
    role: "employee",
  });

  useEffect(() => {
    // Sync user data from backend
    const syncUser = async () => {
      try {
        const response = await apiClient.post("/auth/sync-user");
        if (response.data.success) {
          const userData = response.data.data.user;
          setUser(userData);
          
          // If user has companies and one is already selected, redirect to dashboard
          if (userData.companies && userData.companies.length > 0) {
            const storedCompanyId = localStorage.getItem("companyId");
            const activeCompany = userData.companies.find(
              (c) => c.companyId === storedCompanyId && c.isActive
            );
            
            if (activeCompany && storedCompanyId === activeCompany.companyId) {
              // User already has a company selected, ensure it's set in store and redirect
              setActiveCompany(activeCompany.companyId, activeCompany.role);
              // Wait for state to update
              await new Promise(resolve => setTimeout(resolve, 100));
              router.push("/dashboard");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Sync user error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      syncUser();
    }
  }, [router, setUser, setActiveCompany]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent double submission
    if (creatingCompany || joiningCompany) {
      return;
    }
    
    setError("");
    setCreatingCompany(true);
    // Ensure join form is closed when creating
    setShowJoinForm(false);

    try {
      const response = await apiClient.post("/company/create", {
        name: createFormData.companyName,
        domain: createFormData.domain,
      });

      if (response.data.success) {
        // Refresh user data
        const userResponse = await apiClient.get("/auth/me");
        if (userResponse.data.success) {
          setUser(userResponse.data.data.user);
          const newCompany = userResponse.data.data.user.companies.find(
            (c) => c.companyName === createFormData.companyName
          );
          if (newCompany) {
            setActiveCompany(newCompany.companyId, newCompany.role);
            setCreateFormData({ companyName: "", domain: "" });
            setShowCreateForm(false);
            // Wait a moment to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push("/dashboard");
          }
        }
      }
    } catch (err) {
      console.error("Create company error:", err);
      setError(err.response?.data?.message || "Failed to create company");
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleJoinCompany = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent double submission
    if (creatingCompany || joiningCompany) {
      return;
    }
    
    setError("");
    setJoiningCompany(true);
    // Ensure create form is closed when joining
    setShowCreateForm(false);

    try {
      const response = await apiClient.post("/company/join", {
        companyName: joinFormData.companyName,
        role: joinFormData.role,
      });

      if (response.data.success) {
        // Refresh user data
        const userResponse = await apiClient.get("/auth/me");
        if (userResponse.data.success) {
          setUser(userResponse.data.data.user);
          const joinedCompany = userResponse.data.data.user.companies.find(
            (c) => c.companyName === joinFormData.companyName
          );
          if (joinedCompany) {
            setActiveCompany(joinedCompany.companyId, joinedCompany.role);
            setJoinFormData({ companyName: "", role: "employee" });
            setShowJoinForm(false);
            // Wait a moment to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push("/dashboard");
          }
        }
      }
    } catch (err) {
      console.error("Join company error:", err);
      setError(err.response?.data?.message || "Failed to join company");
    } finally {
      setJoiningCompany(false);
    }
  };

  const handleSelectCompany = async (company) => {
    // Set active company in store and localStorage
    setActiveCompany(company.companyId, company.role);
    
    // Wait a moment to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Redirect to dashboard
    router.push("/dashboard");
  };

  if (loading && !companies) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Super Admin goes directly to super-admin dashboard
  useEffect(() => {
    if (isSuperAdmin()) {
      router.push("/super-admin");
    }
  }, [isSuperAdmin, router]);
  
  if (isSuperAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to Super Admin...</p>
        </div>
      </div>
    );
  }

  // If user has companies and one is selected, redirect to dashboard
  useEffect(() => {
    if (companies && companies.length > 0 && !loading) {
      const storedCompanyId = localStorage.getItem("companyId");
      const activeCompany = companies.find(
        (c) => c.companyId === storedCompanyId && c.isActive
      );
      
      if (activeCompany && storedCompanyId) {
        // Ensure active company is set in store
        setActiveCompany(activeCompany.companyId, activeCompany.role);
        // Small delay to ensure state is set
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      }
    }
  }, [companies, loading, router, setActiveCompany]);

  // Check if company is already selected before rendering
  const storedCompanyId = typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
  if (companies && companies.length > 0 && storedCompanyId) {
    const selectedCompany = companies.find((c) => c.companyId === storedCompanyId);
    if (selectedCompany) {
      // Company already selected, show loading while redirecting
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }
  }

  // If user has companies, show selection
  if (companies && companies.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Select Company</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {companies.map((company) => (
              <div
                key={company.companyId}
                onClick={() => handleSelectCompany(company)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border-2 border-transparent hover:border-blue-500"
              >
                <h3 className="text-xl font-semibold mb-2">{company.companyName}</h3>
                <p className="text-gray-600 mb-4">Role: {company.role.replace("_", " ")}</p>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                  Select Company
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setShowJoinForm(false);
                setCreateFormData({ companyName: "", domain: "" }); // Reset create form
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create New Company
            </button>
            <button
              onClick={() => {
                setShowJoinForm(true);
                setShowCreateForm(false);
                setJoinFormData({ companyName: "", role: "employee" }); // Reset join form
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Join Existing Company
            </button>
          </div>
        </div>

        {/* Create Company Form Modal */}
        {showCreateForm && !showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Create New Company</h2>
              <form onSubmit={handleCreateCompany}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    disabled={creatingCompany || joiningCompany}
                    value={createFormData.companyName}
                    onChange={(e) => setCreateFormData({ ...createFormData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Domain (optional)</label>
                  <input
                    type="text"
                    disabled={creatingCompany || joiningCompany}
                    value={createFormData.domain}
                    onChange={(e) => setCreateFormData({ ...createFormData, domain: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={creatingCompany || joiningCompany}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingCompany ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    disabled={creatingCompany || joiningCompany}
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateFormData({ companyName: "", domain: "" });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Company Form Modal */}
        {showJoinForm && !showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Join Existing Company</h2>
              <form onSubmit={handleJoinCompany}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    disabled={creatingCompany || joiningCompany}
                    value={joinFormData.companyName}
                    onChange={(e) => setJoinFormData({ ...joinFormData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Your Position *</label>
                  <select
                    required
                    disabled={creatingCompany || joiningCompany}
                    value={joinFormData.role}
                    onChange={(e) => setJoinFormData({ ...joinFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={creatingCompany || joiningCompany}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningCompany ? "Joining..." : "Join"}
                  </button>
                  <button
                    type="button"
                    disabled={creatingCompany || joiningCompany}
                    onClick={() => {
                      setShowJoinForm(false);
                      setJoinFormData({ companyName: "", role: "employee" });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // New user - show create/join options
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome! Set Up Your Company</h1>
        <p className="text-center text-gray-600 mb-8">
          You can either create a new company or join an existing one.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Company Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Create New Company</h2>
            <p className="text-gray-600 mb-6">
              Start your own company and become the Company Admin. You'll have full control over
              your company's data and members.
            </p>
            <form onSubmit={handleCreateCompany}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  disabled={creatingCompany || joiningCompany}
                  value={createFormData.companyName}
                  onChange={(e) => setCreateFormData({ ...createFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="My Company"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Domain (optional)</label>
                <input
                  type="text"
                  disabled={creatingCompany || joiningCompany}
                  value={createFormData.domain}
                  onChange={(e) => setCreateFormData({ ...createFormData, domain: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="mycompany.com"
                />
              </div>
              <button
                type="submit"
                disabled={creatingCompany || joiningCompany}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCompany ? "Creating..." : "Create Company"}
              </button>
            </form>
          </div>

          {/* Join Company Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Join Existing Company</h2>
            <p className="text-gray-600 mb-6">
              Join an existing company by entering the company name and your position. The company
              admin will be notified.
            </p>
            <form onSubmit={handleJoinCompany}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  disabled={creatingCompany || joiningCompany}
                  value={joinFormData.companyName}
                  onChange={(e) => setJoinFormData({ ...joinFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Existing Company Name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Your Position *</label>
                <select
                  required
                  disabled={creatingCompany || joiningCompany}
                  value={joinFormData.role}
                  onChange={(e) => setJoinFormData({ ...joinFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creatingCompany || joiningCompany}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningCompany ? "Joining..." : "Join Company"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

