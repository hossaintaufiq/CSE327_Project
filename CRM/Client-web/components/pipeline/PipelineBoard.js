'use client';

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from "@/store/authStore";
import { pipelineApi } from '@/utils/api';
import PipelineColumn from './PipelineColumn';
import PipelineCard from './PipelineCard';
import ApprovalModal from './ApprovalModal';

/**
 * Pipeline Kanban Board Component
 * 
 * Displays entities in a Kanban-style board with drag-and-drop support.
 * Supports: lead, order, project, task pipelines
 */
export function PipelineBoard({ 
  pipelineType = 'lead',
  onEntityClick,
  onError,
  className = '',
}) {
  const { activeCompanyId } = useAuthStore();
  const [config, setConfig] = useState(null);
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [movingEntity, setMovingEntity] = useState(null);

  // Load pipeline config and data
  const loadPipelineData = useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      setLoading(true);
      setError(null);

      // Get pipeline config
      const configResult = await pipelineApi.getConfig(pipelineType);
      if (configResult.success) {
        setConfig(configResult.data);
      }

      // Get summary with counts
      const summaryResult = await pipelineApi.getSummary(pipelineType);
      
      // Load entities for each stage
      const stages = configResult.data?.stages || [];
      const stageEntities = {};
      
      await Promise.all(stages.map(async (stage) => {
        try {
          const result = await pipelineApi.getEntitiesInStage(pipelineType, stage, 50);
          stageEntities[stage] = result.success ? result.data.entities : [];
        } catch (err) {
          stageEntities[stage] = [];
        }
      }));

      setStageData(stageEntities);

      // Load pending approvals
      try {
        const approvalsResult = await pipelineApi.getPendingApprovals();
        if (approvalsResult.success) {
          setPendingApprovals(approvalsResult.data.approvals.filter(
            a => a.pipelineType === pipelineType
          ));
        }
      } catch (err) {
        // User might not have permission
      }

    } catch (err) {
      let errorMessage = 'Failed to load pipeline data. Please try again.';
      if (err.response) {
        const errorData = err.response.data;
        errorMessage = errorData?.message || 
                      errorData?.error?.message || 
                      `Server error: ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message.includes("Network") 
          ? "Network error. Please check your connection."
          : err.message;
      }
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pipelineType, activeCompanyId, onError]);

  useEffect(() => {
    if (!activeCompanyId) return;
    loadPipelineData();
  }, [loadPipelineData, activeCompanyId]);

  // Handle drag start
  const handleDragStart = (entity, fromStage) => {
    setDraggedItem({ entity, fromStage });
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on a stage
  const handleDrop = async (targetStage) => {
    if (!draggedItem) return;

    const { entity, fromStage } = draggedItem;
    
    // Don't do anything if dropping on same stage
    if (fromStage === targetStage) {
      setDraggedItem(null);
      return;
    }

    // Check if transition is valid
    try {
      const validation = await pipelineApi.validateTransition(pipelineType, fromStage, targetStage);
      
      if (!validation.success || !validation.data.validation.valid) {
        setError(validation.data?.validation?.reason || 'Invalid transition');
        setDraggedItem(null);
        return;
      }

      // Move entity
      setMovingEntity(entity._id);
      const result = await pipelineApi.moveToStage(pipelineType, entity._id, targetStage);

      if (result.success) {
        if (result.data.pending) {
          // Approval required - show notification
          setError(null);
          setPendingApprovals(prev => [...prev, result.data.approval]);
        } else {
          // Reload data from server to ensure we have the latest state
          await loadPipelineData();
        }
      } else {
        setError(result.error?.message || 'Failed to move entity');
      }
    } catch (err) {
      setError(err.message || 'Failed to move entity');
    } finally {
      setDraggedItem(null);
      setMovingEntity(null);
    }
  };

  // Handle approval
  const handleApproval = async (approvalId, approved, reason) => {
    try {
      const result = await pipelineApi.processApproval(approvalId, approved, reason);
      
      if (result.success) {
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
        setShowApprovalModal(false);
        setSelectedApproval(null);
        
        // Reload data to reflect changes
        await loadPipelineData();
      } else {
        setError(result.error?.message || 'Failed to process approval');
      }
    } catch (err) {
      setError(err.message || 'Failed to process approval');
    }
  };

  // Get stage color based on type and stage
  const getStageColor = (stage) => {
    const colors = {
      // Lead stages
      prospect: 'bg-gray-100 border-gray-300',
      contacted: 'bg-blue-50 border-blue-300',
      qualified: 'bg-indigo-50 border-indigo-300',
      proposal: 'bg-purple-50 border-purple-300',
      negotiation: 'bg-yellow-50 border-yellow-300',
      won: 'bg-green-50 border-green-300',
      lost: 'bg-red-50 border-red-300',
      
      // Order stages
      pending: 'bg-gray-100 border-gray-300',
      approved: 'bg-blue-50 border-blue-300',
      processing: 'bg-yellow-50 border-yellow-300',
      shipped: 'bg-purple-50 border-purple-300',
      delivered: 'bg-indigo-50 border-indigo-300',
      completed: 'bg-green-50 border-green-300',
      cancelled: 'bg-red-50 border-red-300',
      
      // Project stages
      planning: 'bg-gray-100 border-gray-300',
      in_progress: 'bg-blue-50 border-blue-300',
      on_hold: 'bg-yellow-50 border-yellow-300',
      
      // Task stages
      todo: 'bg-gray-100 border-gray-300',
      review: 'bg-purple-50 border-purple-300',
      done: 'bg-green-50 border-green-300',
    };
    return colors[stage] || 'bg-gray-100 border-gray-300';
  };

  // Format stage name for display
  const formatStageName = (stage) => {
    return stage
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error is passed to parent component for display
  // We'll still show a minimal error state here for the board itself
  if (error && !onError) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => { setError(null); loadPipelineData(); }}
            className="text-red-400 hover:text-red-300 underline text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stages = config?.stages || [];

  return (
    <div className={`${className}`}>
      {/* Header with pending approvals badge */}
      {pendingApprovals.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
              {pendingApprovals.length}
            </span>
            <span className="text-amber-800 font-medium">Pending Approvals</span>
          </div>
          <button
            onClick={() => setShowApprovalModal(true)}
            className="text-amber-700 hover:text-amber-900 font-medium text-sm"
          >
            Review →
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            stageName={formatStageName(stage)}
            colorClass={getStageColor(stage)}
            entities={stageData[stage] || []}
            requiresApproval={config?.requiresApproval?.includes(stage)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage)}
            isDragTarget={draggedItem && draggedItem.fromStage !== stage}
          >
            {(stageData[stage] || []).map((entity) => (
              <PipelineCard
                key={entity._id}
                entity={entity}
                pipelineType={pipelineType}
                isMoving={movingEntity === entity._id}
                onClick={() => onEntityClick?.(entity)}
                onDragStart={() => handleDragStart(entity, stage)}
              />
            ))}
          </PipelineColumn>
        ))}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          approvals={pendingApprovals}
          selectedApproval={selectedApproval}
          onSelect={setSelectedApproval}
          onApprove={(id, reason) => handleApproval(id, true, reason)}
          onReject={(id, reason) => handleApproval(id, false, reason)}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedApproval(null);
          }}
        />
      )}
    </div>
  );
}

export default PipelineBoard;
