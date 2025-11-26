import apiClient from './api.js';

/**
 * Jira API integration for the CRM frontend
 */

// Create a new Jira issue
export const createJiraIssue = async (issueData) => {
  try {
    const response = await apiClient.post('/jira/issue', issueData);
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue:', error);
    throw error;
  }
};

// Add a comment to a Jira issue
export const addJiraComment = async (issueKey, comment) => {
  try {
    const response = await apiClient.post(`/jira/issue/${issueKey}/comment`, { comment });
    return response.data;
  } catch (error) {
    console.error('Error adding Jira comment:', error);
    throw error;
  }
};

// Transition a Jira issue
export const transitionJiraIssue = async (issueKey, transitionData) => {
  try {
    const response = await apiClient.post(`/jira/issue/${issueKey}/transition`, transitionData);
    return response.data;
  } catch (error) {
    console.error('Error transitioning Jira issue:', error);
    throw error;
  }
};

// Get available transitions for a Jira issue
export const getJiraTransitions = async (issueKey) => {
  try {
    const response = await apiClient.get(`/jira/issue/${issueKey}/transitions`);
    return response.data;
  } catch (error) {
    console.error('Error getting Jira transitions:', error);
    throw error;
  }
};

// Manual sync all entities for the company
export const syncAllEntitiesNow = async () => {
  try {
    const response = await apiClient.post('/jira/sync-now');
    return response.data;
  } catch (error) {
    console.error('Error syncing all entities:', error);
    throw error;
  }
};

// Manual sync all entities (alternative endpoint)
export const syncAllEntities = async () => {
  try {
    const response = await apiClient.post('/jira/sync-all');
    return response.data;
  } catch (error) {
    console.error('Error syncing all entities:', error);
    throw error;
  }
};

// Create Jira issue linked to a task
export const createJiraIssueForTask = async (taskId, issueData) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/jira-issue`, issueData);
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue for task:', error);
    throw error;
  }
};

// Create Jira issue linked to a client
export const createJiraIssueForClient = async (clientId, issueData) => {
  try {
    const response = await apiClient.post(`/clients/${clientId}/jira-issue`, issueData);
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue for client:', error);
    throw error;
  }
};

// Create Jira issue linked to an order
export const createJiraIssueForOrder = async (orderId, issueData) => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/jira-issue`, issueData);
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue for order:', error);
    throw error;
  }
};

// Create Jira issue linked to a project
export const createJiraIssueForProject = async (projectId, issueData) => {
  try {
    const response = await apiClient.post(`/projects/${projectId}/jira-issue`, issueData);
    return response.data;
  } catch (error) {
    console.error('Error creating Jira issue for project:', error);
    throw error;
  }
};

// Example usage in a React component:
/*
// In a component file (e.g., components/JiraIntegration.js)

import { useState } from 'react';
import { createJiraIssue, addJiraComment, transitionJiraIssue, getJiraTransitions } from '@/utils/jiraApi.js';

export default function JiraIntegration() {
  const [issueKey, setIssueKey] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateIssue = async () => {
    if (!summary.trim()) return;
    setLoading(true);
    try {
      const result = await createJiraIssue({
        summary,
        description,
        issuetype: 'Task' // or 'Bug', 'Story', etc.
      });
      setIssueKey(result.key);
      alert(`Issue created: ${result.key}`);
    } catch (error) {
      alert('Failed to create issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!issueKey || !comment.trim()) return;
    setLoading(true);
    try {
      await addJiraComment(issueKey, comment);
      alert('Comment added successfully');
      setComment('');
    } catch (error) {
      alert('Failed to add comment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTransitions = async () => {
    if (!issueKey) return;
    setLoading(true);
    try {
      const result = await getJiraTransitions(issueKey);
      setTransitions(result.transitions || []);
    } catch (error) {
      alert('Failed to get transitions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (transitionId) => {
    if (!issueKey) return;
    setLoading(true);
    try {
      await transitionJiraIssue(issueKey, { transitionId });
      alert('Issue transitioned successfully');
      // Refresh transitions
      handleGetTransitions();
    } catch (error) {
      alert('Failed to transition issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Jira Integration</h2>

      {// Create Issue Section }
      <div className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-3">Create New Issue</h3>
        <input
          type="text"
          placeholder="Issue Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          placeholder="Issue Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          rows="3"
        />
        <button
          onClick={handleCreateIssue}
          disabled={loading || !summary.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Issue'}
        </button>
      </div>

      {// Issue Key Input }
      <div className="mb-6">
        <input
          type="text"
          placeholder="Issue Key (e.g., PROJ-123)"
          value={issueKey}
          onChange={(e) => setIssueKey(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {// Add Comment Section }
      <div className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-3">Add Comment</h3>
        <textarea
          placeholder="Comment text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          rows="3"
        />
        <button
          onClick={handleAddComment}
          disabled={loading || !issueKey || !comment.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </button>
      </div>

      {// Transitions Section }
      <div className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-3">Issue Transitions</h3>
        <button
          onClick={handleGetTransitions}
          disabled={loading || !issueKey}
          className="bg-purple-500 text-white px-4 py-2 rounded mb-3 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Transitions'}
        </button>
        <div className="space-y-2">
          {transitions.map((transition) => (
            <button
              key={transition.id}
              onClick={() => handleTransition(transition.id)}
              disabled={loading}
              className="block w-full text-left p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {transition.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

*/