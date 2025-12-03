'use client';

import { useState, useEffect } from 'react';
import useAuthStore from "@/store/authStore";
import { pipelineApi } from '@/utils/api';

/**
 * Pipeline Dashboard Widget
 * 
 * Shows overview of all pipelines with counts per stage.
 */
export function PipelineDashboard({ onPipelineClick, onError }) {
  const { activeCompanyId } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await pipelineApi.getDashboardSummary();
      
      if (result.success) {
        setSummary(result.data.summaries);
        setPendingApprovals(result.data.pendingApprovals || 0);
        setError(null);
      } else {
        const errorMsg = result.message || result.error?.message || "Failed to load pipeline dashboard";
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    } catch (err) {
      let errorMessage = "Failed to load pipeline dashboard. Please try again.";
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
  };

  useEffect(() => {
    if (!activeCompanyId) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId]);

  const pipelineConfig = {
    lead: {
      name: 'Leads',
      icon: '👤',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    order: {
      name: 'Orders',
      icon: '📦',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
    },
    project: {
      name: 'Projects',
      icon: '📋',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
    },
    task: {
      name: 'Tasks',
      icon: '✓',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-700 rounded-lg mb-3"></div>
            <div className="h-4 w-20 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error is handled at page level, so we don't display it here
  if (error) {
    return null; // Error is shown by parent component
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-500/20">
              <span className="text-yellow-400 text-lg">⚠️</span>
            </div>
            <div>
              <p className="font-medium text-yellow-400">
                {pendingApprovals} Pending Approval{pendingApprovals > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-400/70">Items waiting for your review</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm font-medium">
            Review Now
          </button>
        </div>
      )}

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(pipelineConfig).map(([type, config]) => {
          const data = summary?.[type];
          
          return (
            <button
              key={type}
              onClick={() => onPipelineClick?.(type)}
              className={`bg-gray-800 ${config.borderColor} border rounded-xl p-6 text-left hover:border-opacity-60 transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${config.bgColor} rounded-lg`}>
                  <span className="text-2xl">{config.icon}</span>
                </div>
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-xs font-medium`}>
                  {data?.total || 0} total
                </div>
              </div>
              
              <h3 className={`font-semibold ${config.textColor} mb-3 text-lg`}>{config.name}</h3>
              
              {/* Stage breakdown */}
              {data && (
                <div className="space-y-2">
                  {Object.entries(data.counts || {})
                    .filter(([_, count]) => count > 0)
                    .slice(0, 3)
                    .map(([stage, count]) => (
                      <div key={stage} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 capitalize">{stage.replace(/_/g, ' ')}</span>
                        <span className={`font-medium ${config.textColor}`}>{count}</span>
                      </div>
                    ))}
                  {Object.values(data.counts || {}).filter(c => c > 0).length > 3 && (
                    <div className="text-xs text-gray-500 pt-1">
                      +{Object.values(data.counts).filter(c => c > 0).length - 3} more stages
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineDashboard;
