'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { PipelineBoard, PipelineDashboard } from '@/components/pipeline';

/**
 * Pipeline Page
 * 
 * Displays pipeline Kanban boards for leads, orders, projects, and tasks.
 */
export default function PipelinePage() {
  const router = useRouter();
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {sidebarOpen && <Sidebar />}
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedPipeline ? pipelineNames[selectedPipeline] : 'Pipeline Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedPipeline 
                    ? 'Drag and drop items between stages to update their status'
                    : 'Overview of all your pipelines'
                  }
                </p>
              </div>
              
              {selectedPipeline && (
                <button
                  onClick={() => setSelectedPipeline(null)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Overview
                </button>
              )}
            </div>

            {/* Pipeline Type Tabs (when viewing a pipeline) */}
            {selectedPipeline && (
              <div className="mt-4 flex gap-2">
                {Object.keys(pipelineNames).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPipeline(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPipeline === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                  >
                    {pipelineNames[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {selectedPipeline ? (
            <PipelineBoard
              pipelineType={selectedPipeline}
              onEntityClick={handleEntityClick}
            />
          ) : (
            <PipelineDashboard
              onPipelineClick={setSelectedPipeline}
            />
          )}
        </main>
      </div>
    </div>
  );
}
