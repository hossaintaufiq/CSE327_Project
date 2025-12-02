'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PipelineBoard, PipelineDashboard } from '@/components/pipeline';

/**
 * Pipeline Page
 * 
 * Displays pipeline Kanban boards for leads, orders, projects, and tasks.
 */
export default function PipelinePage() {
  const router = useRouter();
  const [selectedPipeline, setSelectedPipeline] = useState(null);

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
    <div className="min-h-screen bg-gray-900">
      <main className="min-h-screen p-6">
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
                <h1 className="text-2xl font-bold text-white">
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
            
            {selectedPipeline && (
              <button
                onClick={() => setSelectedPipeline(null)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
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
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
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
  );
}
