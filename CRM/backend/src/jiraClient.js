import axios from 'axios';

function getAuthHeader() {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const basic = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${basic}`;
}

const api = axios.create({
  baseURL: (process.env.JIRA_BASE_URL || '').replace(/\/$/, '') + '/rest/api/3',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

api.interceptors.request.use(config => {
  config.headers = config.headers || {};
  config.headers.Authorization = getAuthHeader();
  return config;
});

// Create an issue
async function createIssue({ projectKey = process.env.JIRA_PROJECT_KEY, summary, description = '', issuetype = 'Task' }) {
  const body = {
    fields: {
      project: { key: projectKey },
      summary,
      description,
      issuetype: { name: issuetype }
    }
  };
  const resp = await api.post('/issue', body);
  return resp.data; // contains key, id, self
}

// Add a comment
async function addComment(issueKey, comment) {
  const resp = await api.post(`/issue/${encodeURIComponent(issueKey)}/comment`, { body: comment });
  return resp.data;
}

// Get transitions for an issue
async function getTransitions(issueKey) {
  const resp = await api.get(`/issue/${encodeURIComponent(issueKey)}/transitions`);
  return resp.data;
}

// Transition an issue by transition Id or name
async function transitionIssue(issueKey, { transitionId, transitionName }) {
  let id = transitionId;
  if (!id && transitionName) {
    const transitions = await getTransitions(issueKey);
    const found = (transitions.transitions || []).find(t => t.name.toLowerCase() === transitionName.toLowerCase());
    if (!found) {
      throw new Error(`Transition "${transitionName}" not found for ${issueKey}`);
    }
    id = found.id;
  }
  if (!id) throw new Error('transitionId or transitionName required');
  const resp = await api.post(`/issue/${encodeURIComponent(issueKey)}/transitions`, { transition: { id: id.toString() } });
  return resp.data;
}

export { createIssue, addComment, getTransitions, transitionIssue };