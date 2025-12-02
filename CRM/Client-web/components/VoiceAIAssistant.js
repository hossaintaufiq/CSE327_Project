'use client';

import { useState } from 'react';
import { useVoiceAI } from '@/lib/useVoiceAI';

/**
 * Voice AI Assistant Component
 * 
 * A floating voice assistant that allows users to interact with CRM via voice.
 * Uses speech recognition and synthesis for natural conversation.
 */
export function VoiceAIAssistant() {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isSupported,
    isSessionActive,
    fullTranscript,
    response,
    error,
    conversationHistory,
    startSession,
    endSession,
    toggleListening,
    stopSpeaking,
    clearConversation,
    clearError,
  } = useVoiceAI();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isSupported) {
    return null; // Don't show if browser doesn't support speech
  }

  // Minimized floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {isSessionActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-96' : 'w-80'}`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">
                  {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        {isExpanded && (
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {conversationHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Start speaking to interact with your CRM</p>
                <p className="text-xs mt-2">Try: "Show me my tasks" or "What's the pipeline status?"</p>
              </div>
            ) : (
              conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    {msg.action && (
                      <div className={`mt-2 text-xs ${msg.role === 'user' ? 'text-purple-200' : 'text-green-600'}`}>
                        ✓ Executed: {msg.action.tool}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Current Transcript */}
        {fullTranscript && (
          <div className="px-4 py-2 bg-purple-50 border-t border-purple-100">
            <p className="text-sm text-purple-800 italic">"{fullTranscript}"</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-center gap-4">
            {/* Clear button */}
            {conversationHistory.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Main mic button */}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                ${isListening 
                  ? 'bg-red-500 hover:bg-red-600 scale-110' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
                text-white
              `}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isListening ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            {/* Stop speaking button */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Stop speaking"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </button>
            )}
          </div>

          {/* Status text */}
          <p className="text-center text-xs text-gray-500 mt-3">
            {isListening 
              ? 'Tap to stop and send' 
              : isProcessing 
                ? 'Processing your request...'
                : 'Tap to start speaking'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default VoiceAIAssistant;
