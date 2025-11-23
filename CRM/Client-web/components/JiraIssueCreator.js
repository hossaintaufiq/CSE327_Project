import { useState } from 'react';
import { Bug, Plus } from 'lucide-react';

export default function JiraIssueCreator({
  entityType, // 'task', 'client', 'order', 'project'
  entityId,
  entityName,
  onIssueCreated,
  buttonText = "Create Jira Issue",
  buttonVariant = "secondary" // 'primary', 'secondary', 'outline'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    issuetype: 'Task'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) return;

    setLoading(true);
    try {
      let result;
      const issueData = { ...formData };

      // Import the appropriate function dynamically
      const { createJiraIssueForTask, createJiraIssueForClient, createJiraIssueForOrder, createJiraIssueForProject } = await import('@/utils/jiraApi.js');

      switch (entityType) {
        case 'task':
          result = await createJiraIssueForTask(entityId, issueData);
          break;
        case 'client':
          result = await createJiraIssueForClient(entityId, issueData);
          break;
        case 'order':
          result = await createJiraIssueForOrder(entityId, issueData);
          break;
        case 'project':
          result = await createJiraIssueForProject(entityId, issueData);
          break;
        default:
          throw new Error('Invalid entity type');
      }

      alert(`Jira issue created: ${result.data.jiraIssue.key}`);
      setIsOpen(false);
      setFormData({ summary: '', description: '', issuetype: 'Task' });

      // Notify parent component
      if (onIssueCreated) {
        onIssueCreated(result.data);
      }
    } catch (error) {
      alert('Failed to create Jira issue: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
    switch (buttonVariant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
      case 'outline':
        return `${baseClasses} border border-gray-300 text-gray-700 hover:bg-gray-50`;
      default: // secondary
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={getButtonClasses()}
        title={`Create Jira issue for ${entityType}: ${entityName}`}
      >
        <Bug className="w-4 h-4" />
        {buttonText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Create Jira Issue
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Creating issue for: <strong>{entityName}</strong>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary *
                </label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Issue with ${entityName}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type
                </label>
                <select
                  value={formData.issuetype}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuetype: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Story">Story</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.summary.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}