"use client";
import { useState, useEffect } from "react";

export default function VerifyConnectionPage() {
  const [status, setStatus] = useState("testing");
  const [results, setResults] = useState({
    backendHealth: null,
    corsWorking: null,
    apiUrl: null,
    error: null,
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      setResults((prev) => ({ ...prev, apiUrl: backendUrl }));

      // Test 1: Check if backend is running
      console.log("🔍 Testing backend health...");
      const healthResponse = await fetch(`${backendUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const healthData = await healthResponse.json();
      console.log("✅ Backend response:", healthData);

      setResults((prev) => ({
        ...prev,
        backendHealth: {
          success: healthResponse.ok,
          status: healthResponse.status,
          data: healthData,
        },
        corsWorking: healthResponse.ok,
      }));

      setStatus("success");
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      setResults((prev) => ({
        ...prev,
        error: error.message,
        backendHealth: { success: false, error: error.message },
      }));
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Frontend-Backend Connection Verify</h1>

        {/* Status Banner */}
        <div
          className={`mb-8 p-6 rounded-lg ${
            status === "success"
              ? "bg-green-900/30 border border-green-500"
              : status === "error"
              ? "bg-red-900/30 border border-red-500"
              : "bg-blue-900/30 border border-blue-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {status === "success" && (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-green-400">Connected!</p>
                  <p className="text-sm text-green-300">Frontend and Backend are communicating</p>
                </div>
              </>
            )}
            {status === "error" && (
              <>
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-bold text-red-400">Connection Failed</p>
                  <p className="text-sm text-red-300">{results.error}</p>
                </div>
              </>
            )}
            {status === "testing" && (
              <>
                <span className="text-2xl animate-spin">🔄</span>
                <div>
                  <p className="font-bold text-blue-400">Testing Connection...</p>
                  <p className="text-sm text-blue-300">Please wait</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>

            {/* API URL */}
            <div className="mb-4 pb-4 border-b border-zinc-700">
              <p className="text-sm text-zinc-400">Backend API URL</p>
              <p className="font-mono text-green-400 break-all">{results.apiUrl}</p>
            </div>

            {/* Health Check */}
            <div className="mb-4 pb-4 border-b border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <span>{results.backendHealth?.success ? "✅" : "❌"}</span>
                <p className="font-semibold">Backend Health Check</p>
              </div>
              {results.backendHealth?.success ? (
                <>
                  <p className="text-sm text-zinc-400">Status Code: {results.backendHealth?.status}</p>
                  <pre className="bg-zinc-900 p-3 rounded mt-2 text-xs overflow-auto text-green-400">
                    {JSON.stringify(results.backendHealth?.data, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-red-400 text-sm">{results.backendHealth?.error}</p>
              )}
            </div>

            {/* CORS Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>{results.corsWorking ? "✅" : "❌"}</span>
                <p className="font-semibold">CORS Configuration</p>
              </div>
              <p className="text-sm text-zinc-400">
                {results.corsWorking
                  ? "CORS is properly configured. Frontend can access backend."
                  : "CORS issue detected. Check backend configuration."}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-900/20 border border-blue-600 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Next Steps</h3>
            {status === "success" ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                <li>✅ Backend is running on port 5000</li>
                <li>✅ Frontend can reach the backend</li>
                <li>✅ CORS is configured correctly</li>
                <li>🎯 Try logging in to test full authentication flow</li>
                <li>📊 Visit /dashboard to test protected routes</li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-zinc-300">
                <li>1️⃣ Ensure backend is running: <code className="bg-zinc-800 px-2 py-1 rounded">npm run dev</code> in /backend</li>
                <li>2️⃣ Verify backend URL: Should be http://localhost:5000</li>
                <li>3️⃣ Check firewall/network settings</li>
                <li>4️⃣ Verify .env.local has correct <code className="bg-zinc-800 px-2 py-1 rounded">NEXT_PUBLIC_BACKEND_URL</code></li>
                <li>5️⃣ Check browser console for detailed errors</li>
              </ul>
            )}
          </div>

          {/* Debug Info */}
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Debug Information</h3>
            <div className="space-y-2 text-xs font-mono text-zinc-400">
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
              <p>Browser: {typeof navigator !== "undefined" ? navigator.userAgent.split(" ").pop() : "N/A"}</p>
            </div>
          </div>

          {/* Retry Button */}
          <button
            onClick={testConnection}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
          >
            🔄 Retry Connection Test
          </button>
        </div>
      </div>
    </div>
  );
}
