import { ExternalLink, Bug } from 'lucide-react';

export default function JiraIssuesList({ jiraIssues = [], title = "Linked Jira Issues" }) {
  if (!jiraIssues || jiraIssues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Bug className="w-4 h-4" />
        {title}
      </h4>

      <div className="space-y-2">
        {jiraIssues.map((issue, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">{issue.issueKey}</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            <a
              href={issue.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View in Jira
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}