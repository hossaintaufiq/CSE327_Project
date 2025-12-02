'use client';

/**
 * Pipeline Column Component
 * 
 * Represents a single stage column in the Kanban board.
 */
export function PipelineColumn({
  stage,
  stageName,
  colorClass,
  entities,
  requiresApproval,
  onDragOver,
  onDrop,
  isDragTarget,
  children,
}) {
  return (
    <div
      className={`shrink-0 w-72 rounded-lg border-2 ${colorClass} ${
        isDragTarget ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200 bg-white bg-opacity-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{stageName}</h3>
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-white text-gray-600 text-sm font-medium shadow-sm">
            {entities.length}
          </span>
        </div>
        {requiresApproval && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            Requires approval
          </div>
        )}
      </div>

      {/* Column Content */}
      <div className="p-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <div className="space-y-2">
          {children}
        </div>

        {entities.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

export default PipelineColumn;
