'use client';

/**
 * Pipeline Card Component
 * 
 * Represents an entity card in the Kanban board.
 * Supports drag-and-drop.
 */
export function PipelineCard({
  entity,
  pipelineType,
  isMoving,
  onClick,
  onDragStart,
}) {
  // Get display fields based on pipeline type
  const getDisplayInfo = () => {
    switch (pipelineType) {
      case 'lead':
        return {
          title: entity.name || entity.companyName || 'Unnamed Lead',
          subtitle: entity.email || entity.phone || '',
          badge: entity.source,
          value: entity.estimatedValue ? `$${entity.estimatedValue.toLocaleString()}` : null,
        };
      case 'order':
        return {
          title: entity.orderNumber || `Order #${entity._id?.slice(-6)}`,
          subtitle: entity.clientName || '',
          badge: entity.priority,
          value: entity.totalAmount ? `$${entity.totalAmount.toLocaleString()}` : null,
        };
      case 'project':
        return {
          title: entity.name || entity.title || 'Unnamed Project',
          subtitle: entity.clientName || '',
          badge: entity.priority,
          value: entity.budget ? `$${entity.budget.toLocaleString()}` : null,
        };
      case 'task':
        return {
          title: entity.title || entity.name || 'Unnamed Task',
          subtitle: entity.assigneeName || entity.projectName || '',
          badge: entity.priority,
          value: entity.dueDate ? new Date(entity.dueDate).toLocaleDateString() : null,
        };
      default:
        return {
          title: entity.name || entity.title || 'Unnamed',
          subtitle: '',
          badge: null,
          value: null,
        };
    }
  };

  const { title, subtitle, badge, value } = getDisplayInfo();

  // Priority/Badge colors
  const getBadgeColor = (badgeValue) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
      urgent: 'bg-red-100 text-red-700',
      website: 'bg-blue-100 text-blue-700',
      referral: 'bg-purple-100 text-purple-700',
      social: 'bg-pink-100 text-pink-700',
      direct: 'bg-gray-100 text-gray-700',
    };
    return colors[badgeValue?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer
        hover:shadow-md hover:border-gray-300 transition-all duration-200
        ${isMoving ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm truncate">{title}</h4>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-gray-500 text-xs mt-1 truncate">{subtitle}</p>
      )}

      {/* Footer with badge and value */}
      <div className="flex items-center justify-between mt-2">
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeColor(badge)}`}>
            {badge}
          </span>
        )}
        {value && (
          <span className="text-xs font-semibold text-gray-700">{value}</span>
        )}
      </div>

      {/* Assignee avatar or date indicator */}
      {entity.assigneeAvatar && (
        <div className="mt-2 flex items-center gap-2">
          <img 
            src={entity.assigneeAvatar} 
            alt="" 
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs text-gray-500">{entity.assigneeName}</span>
        </div>
      )}

      {/* Due date warning for tasks */}
      {pipelineType === 'task' && entity.dueDate && new Date(entity.dueDate) < new Date() && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Overdue
        </div>
      )}

      {/* Moving indicator */}
      {isMoving && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}

export default PipelineCard;
