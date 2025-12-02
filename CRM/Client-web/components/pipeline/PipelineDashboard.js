'use client';

import { useState, useEffect } from 'react';
import { pipelineApi } from '@/utils/api';

/**
 * Pipeline Dashboard Widget
 * 
 * Shows overview of all pipelines with counts per stage.
 */
export function PipelineDashboard({ onPipelineClick }) {
  const [summary, setSummary] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await pipelineApi.getDashboardSummary();
        
        if (result.success) {
          setSummary(result.data.summaries);
          setPendingApprovals(result.data.pendingApprovals);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const pipelineConfig = {
    lead: {
      name: 'Leads',
      icon: '👤',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
    },
    order: {
      name: 'Orders',
      icon: '📦',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
    },
    project: {
      name: 'Projects',
      icon: '📋',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
    },
    task: {
      name: 'Tasks',
      icon: '✓',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100">
              <span className="text-amber-600 text-lg">⚠️</span>
            </div>
            <div>
              <p className="font-medium text-amber-800">
                {pendingApprovals} Pending Approval{pendingApprovals > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-600">Items waiting for your review</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
            Review Now
          </button>
        </div>
      )}

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(pipelineConfig).map(([type, config]) => {
          const data = summary?.[type];
          
          return (
            <button
              key={type}
              onClick={() => onPipelineClick?.(type)}
              className={`${config.bgColor} rounded-xl p-4 text-left hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{config.icon}</span>
                <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-xs font-medium`}>
                  {data?.total || 0} total
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{config.name}</h3>
              
              {/* Stage breakdown */}
              {data && (
                <div className="space-y-1">
                  {Object.entries(data.counts || {})
                    .filter(([_, count]) => count > 0)
                    .slice(0, 3)
                    .map(([stage, count]) => (
                      <div key={stage} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">{stage.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-800">{count}</span>
                      </div>
                    ))}
                  {Object.values(data.counts || {}).filter(c => c > 0).length > 3 && (
                    <div className="text-xs text-gray-500">
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
