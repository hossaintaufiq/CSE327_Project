'use client';

import { useState } from 'react';

/**
 * Approval Modal Component
 * 
 * Displays pending approvals and allows admins to approve/reject.
 */
export function ApprovalModal({
  approvals,
  selectedApproval,
  onSelect,
  onApprove,
  onReject,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setProcessing(true);
    await onApprove(selectedApproval.id, reason);
    setProcessing(false);
    setReason('');
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    setProcessing(true);
    await onReject(selectedApproval.id, reason);
    setProcessing(false);
    setReason('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatStageName = (stage) => {
    return stage
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Approval List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {approvals.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No pending approvals
              </div>
            ) : (
              <div className="divide-y">
                {approvals.map((approval) => (
                  <button
                    key={approval.id}
                    onClick={() => onSelect(approval)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedApproval?.id === approval.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">
                        {approval.pipelineType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(approval.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{formatStageName(approval.currentStage)}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="font-medium text-blue-600">{formatStageName(approval.targetStage)}</span>
                    </div>
                    {approval.notes && (
                      <p className="mt-1 text-xs text-gray-500 truncate">{approval.notes}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Approval Detail */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedApproval ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Approval Details</h3>
                
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider">Pipeline</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">{selectedApproval.pipelineType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider">Transition</dt>
                    <dd className="text-sm">
                      <span className="text-gray-600">{formatStageName(selectedApproval.currentStage)}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-blue-600">{formatStageName(selectedApproval.targetStage)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider">Requested At</dt>
                    <dd className="text-sm text-gray-900">{formatDate(selectedApproval.createdAt)}</dd>
                  </div>
                  {selectedApproval.notes && (
                    <div>
                      <dt className="text-xs text-gray-500 uppercase tracking-wider">Notes</dt>
                      <dd className="text-sm text-gray-900">{selectedApproval.notes}</dd>
                    </div>
                  )}
                </dl>

                {/* Reason input */}
                <div className="mt-6">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add a reason for your decision..."
                  />
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select an approval to review
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApprovalModal;
