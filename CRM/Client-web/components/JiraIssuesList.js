import { ExternalLink, Bug } from 'lucide-react';

export default function JiraIssuesList({ jiraIssues = [], title = "Linked Jira Issues" }) {
  if (!jiraIssues || jiraIssues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <Bug className="w-4 h-4 text-blue-400" />
        {title}
      </h4>

      <div className="space-y-2">
        {jiraIssues.map((issue, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-650 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">{issue.issueKey}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            <a
              href={issue.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
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