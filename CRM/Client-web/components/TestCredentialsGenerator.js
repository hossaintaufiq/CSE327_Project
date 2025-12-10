'use client';

import { useState } from 'react';
import { Key, Copy, Check, Download, RefreshCw } from 'lucide-react';

export default function TestCredentialsGenerator() {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});

  const generateSampleCredentials = () => {
    setLoading(true);
    setError('');

    // Generate sample IDs and tokens (for testing only)
    const sampleCredentials = {
      timestamp: new Date().toISOString(),
      
      // Sample User IDs
      users: {
        client: {
          userId: generateMongoId(),
          firebaseUid: generateFirebaseUid(),
          email: 'testclient@example.com',
          role: 'client'
        },
        admin: {
          userId: generateMongoId(),
          firebaseUid: generateFirebaseUid(),
          email: 'testadmin@example.com',
          role: 'company_admin'
        },
        employee: {
          userId: generateMongoId(),
          firebaseUid: generateFirebaseUid(),
          email: 'testemployee@example.com',
          role: 'employee'
        }
      },
      
      // Sample Company IDs
      companies: [
        {
          companyId: generateMongoId(),
          name: 'Test Company 1',
          domain: 'testcompany1.com'
        },
        {
          companyId: generateMongoId(),
          name: 'Test Company 2',
          domain: 'testcompany2.com'
        }
      ],
      
      // Sample Auth Token (JWT format)
      authToken: {
        token: generateSampleJWT(),
        expiresIn: '1 hour',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      },
      
      // Sample API Keys
      apiKeys: {
        geminiApiKey: generateApiKey('GEMINI'),
        dailyApiKey: generateApiKey('DAILY')
      },
      
      // Note
      note: 'These are SAMPLE credentials for testing only. For real credentials, use the backend generator: node test-credentials-generator.js --login email password'
    };

    setTimeout(() => {
      setCredentials(sampleCredentials);
      setLoading(false);
    }, 500);
  };

  const generateMongoId = () => {
    return Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const generateFirebaseUid = () => {
    return Array.from({ length: 28 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('');
  };

  const generateSampleJWT = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: generateFirebaseUid(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = Array.from({ length: 43 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[
        Math.floor(Math.random() * 64)
      ]
    ).join('');
    return `${header}.${payload}.${signature}`;
  };

  const generateApiKey = (prefix) => {
    return `${prefix}_${Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('')}`;
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadAsJSON = () => {
    const dataStr = JSON.stringify(credentials, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-credentials-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsEnv = () => {
    if (!credentials) return;
    
    const envContent = `# Test Credentials - Generated ${credentials.timestamp}
# WARNING: These are SAMPLE credentials for testing only

# User IDs
TEST_CLIENT_USER_ID=${credentials.users.client.userId}
TEST_CLIENT_FIREBASE_UID=${credentials.users.client.firebaseUid}
TEST_ADMIN_USER_ID=${credentials.users.admin.userId}
TEST_ADMIN_FIREBASE_UID=${credentials.users.admin.firebaseUid}

# Company IDs
TEST_COMPANY_ID_1=${credentials.companies[0].companyId}
TEST_COMPANY_ID_2=${credentials.companies[1].companyId}

# Auth Token
TEST_AUTH_TOKEN=${credentials.authToken.token}

# API Keys (samples)
GEMINI_API_KEY=${credentials.apiKeys.geminiApiKey}
DAILY_API_KEY=${credentials.apiKeys.dailyApiKey}
`;

    const dataBlob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test.env`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const CopyButton = ({ text, copyKey, label }) => (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex-1 mr-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-200 font-mono break-all">{text}</p>
      </div>
      <button
        onClick={() => copyToClipboard(text, copyKey)}
        className="p-2 hover:bg-gray-700 rounded transition-colors shrink-0"
        title="Copy to clipboard"
      >
        {copied[copyKey] ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Test Credentials Generator</h1>
          </div>
          <p className="text-gray-400">
            Generate sample IDs and tokens for API testing. For real credentials, use the backend generator.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generateSampleCredentials}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Generate Sample Credentials
                </>
              )}
            </button>

            {credentials && (
              <>
                <button
                  onClick={downloadAsJSON}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download JSON
                </button>
                <button
                  onClick={downloadAsEnv}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download .env
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Credentials Display */}
        {credentials && (
          <div className="p-6 space-y-6">
            {/* Warning */}
            <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
              <p className="text-yellow-400 text-sm font-medium">
                ⚠️ {credentials.note}
              </p>
            </div>

            {/* Users Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">👥 Test Users</h2>
              <div className="space-y-4">
                {Object.entries(credentials.users).map(([role, user]) => (
                  <div key={role} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                      {role} User
                    </h3>
                    <div className="space-y-2">
                      <CopyButton 
                        text={user.email} 
                        copyKey={`${role}-email`}
                        label="Email"
                      />
                      <CopyButton 
                        text={user.userId} 
                        copyKey={`${role}-userId`}
                        label="User ID (MongoDB)"
                      />
                      <CopyButton 
                        text={user.firebaseUid} 
                        copyKey={`${role}-firebaseUid`}
                        label="Firebase UID"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Companies Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🏢 Test Companies</h2>
              <div className="space-y-3">
                {credentials.companies.map((company, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {company.name}
                    </h3>
                    <div className="space-y-2">
                      <CopyButton 
                        text={company.companyId} 
                        copyKey={`company-${idx}`}
                        label="Company ID"
                      />
                      <CopyButton 
                        text={company.domain} 
                        copyKey={`domain-${idx}`}
                        label="Domain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Token Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🔐 Auth Token</h2>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <CopyButton 
                  text={credentials.authToken.token} 
                  copyKey="auth-token"
                  label="JWT Token (Sample)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Expires: {new Date(credentials.authToken.expiresAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* API Keys Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">🔑 API Keys</h2>
              <div className="space-y-3">
                <CopyButton 
                  text={credentials.apiKeys.geminiApiKey} 
                  copyKey="gemini-key"
                  label="Gemini API Key (Sample)"
                />
                <CopyButton 
                  text={credentials.apiKeys.dailyApiKey} 
                  copyKey="daily-key"
                  label="Daily.co API Key (Sample)"
                />
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                📖 How to Use
              </h3>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Use these sample credentials for frontend UI testing</li>
                <li>For backend API tests, run: <code className="bg-gray-800 px-2 py-1 rounded">node test-credentials-generator.js --login email password</code></li>
                <li>Copy individual values or download as JSON/ENV file</li>
                <li>Replace with real credentials before production</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
