"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/utils/api";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  DollarSign,
  Activity,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function AIInsightsPanel({ companyId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRecommendation, setExpandedRecommendation] = useState(null);

  useEffect(() => {
    if (companyId) {
      loadInsights();
    }
  }, [companyId]);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/ai/company/insights");
      console.log("AI Insights API Response:", response?.data);
      
      if (response?.data?.success === true) {
        setInsights(response.data.data);
        setError(""); // Clear any previous errors
      } else {
        const errorMsg = response?.data?.error?.message || response?.data?.message || "Failed to load insights";
        console.error("AI Insights failed:", errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      
      let errorMessage = "Failed to load AI insights. Please try again.";
      let showSetupInstructions = false;
      
      // Network errors
      if (!error.response) {
        if (error.message?.includes('Network') || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorMessage = "Cannot connect to backend server. Please make sure the backend server is running on port 5000.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error.response) {
        const errorData = error.response.data;
        errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
        
        // Check if it's an API key configuration error
        if (errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          showSetupInstructions = true;
        }
        
        // Check for 404 (endpoint not found)
        if (error.response.status === 404) {
          errorMessage = "AI insights endpoint not found. Please check backend server configuration.";
        }
        
        // Check for 500 (server error)
        if (error.response.status === 500) {
          errorMessage = "Server error while generating insights. Check backend console for details.";
        }
      } else if (error.message?.includes('API key') || error.message?.includes('403')) {
        showSetupInstructions = true;
        errorMessage = error.message;
      }
      
      if (showSetupInstructions) {
        errorMessage = (
          <div>
            <p className="mb-3 font-semibold">Gemini API Key Not Configured</p>
            <p className="mb-2 text-sm">To enable AI insights, you need to:</p>
            <ol className="list-decimal list-inside text-sm space-y-1 mb-3">
              <li>Get a free Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a></li>
              <li>Add it to your backend <code className="bg-gray-700 px-1 rounded">.env</code> file as <code className="bg-gray-700 px-1 rounded">GEMINI_API_KEY=your_key_here</code></li>
              <li>Restart your backend server</li>
            </ol>
            <p className="text-xs text-gray-400 mt-2">The API key is completely free and includes generous usage limits.</p>
          </div>
        );
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const getHealthColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBgColor = (score) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/50";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/50";
    return "bg-red-500/20 border-red-500/50";
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  if (loading && !insights) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            AI-Powered Insights
          </h2>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating AI insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            AI-Powered Insights
          </h2>
          <button
            onClick={loadInsights}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Retry"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-red-400 text-sm">
              {typeof error === 'string' ? error : error}
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300 shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  // Handle case where insights might be structured differently
  const insightsData = insights?.insights || insights;
  const stats = insights?.stats || {};

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-400" />
          AI-Powered Insights
        </h2>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh insights"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall Health Score */}
      <div className={`mb-6 p-4 rounded-lg border ${getHealthBgColor(insightsData?.overallHealthScore || 70)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Overall Business Health</p>
            <p className={`text-3xl font-bold ${getHealthColor(insightsData?.overallHealthScore || 70)}`}>
              {insightsData?.overallHealthScore || 70}/100
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Sales</p>
              <p className={`text-lg font-semibold ${getHealthColor(insightsData?.salesPerformance?.score || 70)}`}>
                {insightsData?.salesPerformance?.score || 70}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Management</p>
              <p className={`text-lg font-semibold ${getHealthColor(insightsData?.managementPerformance?.score || 70)}`}>
                {insightsData?.managementPerformance?.score || 70}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths & Weaknesses */}
        <div className="space-y-4">
          {insightsData?.salesPerformance?.strengths?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales Strengths
              </h3>
              <ul className="space-y-1">
                {insightsData.salesPerformance.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insightsData?.salesPerformance?.weaknesses?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {insightsData.salesPerformance.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Quick Tips
          </h3>
          <ul className="space-y-2">
            {insightsData?.quickTips?.map((tip, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {insightsData?.recommendations?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Strategic Recommendations
          </h3>
          <div className="space-y-2">
            {insightsData.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)} cursor-pointer transition-colors hover:opacity-80`}
                onClick={() => setExpandedRecommendation(expandedRecommendation === idx ? null : idx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase">{rec.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm">{rec.tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {insightsData?.keyMetrics && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightsData.keyMetrics.performingWell?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Performing Well
              </h4>
              <ul className="space-y-1">
                {insightsData.keyMetrics.performingWell.map((metric, idx) => (
                  <li key={idx} className="text-xs text-gray-300">{metric}</li>
                ))}
              </ul>
            </div>
          )}
          {insightsData.keyMetrics.needsAttention?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Needs Attention
              </h4>
              <ul className="space-y-1">
                {insightsData.keyMetrics.needsAttention.map((metric, idx) => (
                  <li key={idx} className="text-xs text-gray-300">{metric}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

