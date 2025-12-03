'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from "@/store/authStore";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, RefreshCw, AlertCircle, X } from 'lucide-react';
import { PipelineBoard, PipelineDashboard } from '@/components/pipeline';

/**
 * Pipeline Page
 * 
 * Displays pipeline Kanban boards for leads, orders, projects, and tasks.
 */
export default function PipelinePage() {
  const router = useRouter();
  const { activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const checkAuthAndCompany = async () => {
      // Check if user is logged in
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      // If super admin, redirect to super-admin page
      if (isSuperAdmin()) {
        router.push("/super-admin");
        return;
      }

      // Check for active company
      if (!activeCompanyId) {
        const storedCompanyId = localStorage.getItem("companyId");
        if (!storedCompanyId) {
          router.push("/company-selection");
          return;
        }
      }
    };

    checkAuthAndCompany();
  }, [router, activeCompanyId, isSuperAdmin]);

  const pipelineNames = {
    lead: 'Leads Pipeline',
    order: 'Orders Pipeline',
    project: 'Projects Pipeline',
    task: 'Tasks Pipeline',
  };

  const handleEntityClick = (entity) => {
    // Navigate to entity detail page
    const routes = {
      lead: `/clients/${entity._id}`,
      order: `/orders/${entity._id}`,
      project: `/projects/${entity._id}`,
      task: `/tasks/${entity._id}`,
    };
    
    if (routes[selectedPipeline]) {
      router.push(routes[selectedPipeline]);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pt-[60px]">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {selectedPipeline ? pipelineNames[selectedPipeline] : 'Pipeline Management'}
                  </h1>
                  <p className="text-gray-400 mt-1">
                    {selectedPipeline 
                      ? 'Drag and drop items between stages to update their status'
                      : 'Overview of all your pipelines'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setError("");
                    setRefreshKey(prev => prev + 1);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
                  title="Refresh pipeline"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                {selectedPipeline && (
                  <button
                    onClick={() => {
                      setSelectedPipeline(null);
                      setError("");
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Overview
                  </button>
                )}
              </div>
            </div>

            {/* Pipeline Type Tabs (when viewing a pipeline) */}
            {selectedPipeline && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {Object.keys(pipelineNames).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedPipeline(type);
                      setError("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPipeline === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {pipelineNames[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-300 shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Content */}
          {selectedPipeline ? (
            <PipelineBoard
              key={`board-${selectedPipeline}-${activeCompanyId}-${refreshKey}`}
              pipelineType={selectedPipeline}
              onEntityClick={handleEntityClick}
              onError={(errorMsg) => setError(errorMsg)}
            />
          ) : (
            <PipelineDashboard
              key={`dashboard-${activeCompanyId}-${refreshKey}`}
              onPipelineClick={setSelectedPipeline}
              onError={(errorMsg) => setError(errorMsg)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
