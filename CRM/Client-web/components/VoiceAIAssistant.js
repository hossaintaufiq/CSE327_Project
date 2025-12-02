'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceAI } from '@/lib/useVoiceAI';

/**
 * Voice AI Assistant Component
 * 
 * A floating voice assistant that allows users to interact with CRM via voice.
 * Uses speech recognition and synthesis for natural conversation.
 * Features advanced animations and visual feedback.
 */

// Animated sound wave bars component
function SoundWave({ isActive, color = 'white' }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            color === 'white' ? 'bg-white' : 'bg-purple-600'
          }`}
          style={{
            height: isActive ? `${Math.random() * 16 + 8}px` : '4px',
            animation: isActive ? `soundWave 0.4s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes soundWave {
          0% { height: 8px; }
          100% { height: 24px; }
        }
      `}</style>
    </div>
  );
}

// Ripple effect component for mic button
function RippleEffect({ isActive }) {
  if (!isActive) return null;
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '1.5s' }} />
      <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
      <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" style={{ animationDuration: '2.5s' }} />
    </>
  );
}

// Processing dots animation
function ProcessingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// AI typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            style={{
              animation: 'typingBounce 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

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
  const [showHint, setShowHint] = useState(true);
  const conversationRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Hide hint after first interaction
  useEffect(() => {
    if (conversationHistory.length > 0) {
      setShowHint(false);
    }
  }, [conversationHistory]);

  if (!isSupported) {
    return null; // Don't show if browser doesn't support speech
  }

  // Minimized floating button with enhanced animation
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Ambient glow effect */}
        <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
          isSessionActive ? 'bg-purple-400 opacity-50' : 'opacity-0'
        }`} />
        
        <button
          onClick={() => setIsMinimized(false)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        >
          <RippleEffect isActive={isListening} />
          
          {isListening ? (
            <SoundWave isActive={true} />
          ) : (
            <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          
          {/* Status indicators */}
          {isSessionActive && !isListening && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
          {isProcessing && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-spin" />
          )}
        </button>
        
        {/* Floating hint tooltip */}
        {showHint && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap animate-fadeIn">
            <span>Click to open AI Assistant</span>
            <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${isExpanded ? 'w-[420px]' : 'w-80'}`}>
      {/* Ambient glow effect */}
      <div className={`absolute inset-0 rounded-2xl blur-2xl transition-all duration-500 ${
        isListening ? 'bg-red-400 opacity-30 scale-105' : 
        isProcessing ? 'bg-amber-400 opacity-20' :
        isSpeaking ? 'bg-green-400 opacity-20' :
        'bg-purple-400 opacity-10'
      }`} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
        {/* Header with enhanced gradient animation */}
        <div className={`relative p-4 text-white overflow-hidden ${
          isListening 
            ? 'bg-gradient-to-r from-red-500 to-pink-500' 
            : 'bg-gradient-to-r from-purple-600 to-indigo-600'
        } transition-all duration-500`}>
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {isListening && (
              <>
                <div className="absolute w-32 h-32 -top-16 -left-16 bg-white/10 rounded-full animate-pulse" />
                <div className="absolute w-24 h-24 -bottom-12 -right-12 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 ${
                isListening ? 'scale-110' : ''
              }`}>
                {isListening ? (
                  <SoundWave isActive={true} />
                ) : isSpeaking ? (
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.5 1a.5.5 0 0 1 .5.5v21a.5.5 0 0 1-1 0v-21a.5.5 0 0 1 .5-.5zm4 4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13a.5.5 0 0 1 .5-.5zm-8 2a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5zm12 1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm-16 1a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5zm20 1.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  AI Assistant
                  {isProcessing && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                      <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/80 transition-all duration-300">
                  {isListening ? '🎤 Listening to you...' : 
                   isProcessing ? '🧠 Thinking...' : 
                   isSpeaking ? '🗣️ Speaking...' : 
                   '✨ Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Conversation Area with enhanced styling */}
        {isExpanded && (
          <div 
            ref={conversationRef}
            className="h-72 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white scroll-smooth"
          >
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-fadeIn">
                <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-2">Start a Voice Conversation</p>
                <p className="text-xs text-center max-w-[200px]">Click the microphone and try saying:</p>
                <div className="mt-3 space-y-2">
                  {['"Show me my tasks"', '"What\'s in the pipeline?"', '"Create a follow-up task"'].map((hint, i) => (
                    <div 
                      key={i}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs animate-fadeIn"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {hint}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                  style={{ animationDelay: '0.05s' }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.action && (
                      <div className={`mt-2 pt-2 border-t ${
                        msg.role === 'user' ? 'border-white/20 text-purple-200' : 'border-gray-100 text-green-600'
                      }`}>
                        <div className="flex items-center gap-1.5 text-xs">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Executed: {msg.action.tool}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md p-3 shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Transcript with enhanced styling */}
        {fullTranscript && (
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <SoundWave isActive={isListening} color="purple" />
              </div>
              <p className="text-sm text-purple-800 italic flex-1">"{fullTranscript}"</p>
            </div>
          </div>
        )}

        {/* Error with animation */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between animate-shake">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={clearError} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Controls with enhanced animations */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-center gap-6">
            {/* Clear button */}
            {conversationHistory.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Main mic button with ripple effects */}
            <div className="relative">
              <RippleEffect isActive={isListening} />
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform
                  ${isListening 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110 shadow-lg shadow-red-200' 
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:scale-105 shadow-lg shadow-purple-200'
                  }
                  ${isProcessing ? 'opacity-60 cursor-not-allowed scale-100' : 'hover:shadow-xl'}
                  text-white
                `}
              >
                {isProcessing ? (
                  <ProcessingDots />
                ) : isListening ? (
                  <div className="relative">
                    <SoundWave isActive={true} />
                  </div>
                ) : (
                  <svg className="w-8 h-8 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Stop speaking button */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 animate-fadeIn"
                title="Stop speaking"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </button>
            )}
          </div>

          {/* Status text with animations */}
          <div className="mt-4 text-center">
            <p className={`text-xs transition-all duration-300 ${
              isListening ? 'text-red-500 font-medium' :
              isProcessing ? 'text-amber-600' :
              isSpeaking ? 'text-green-600' :
              'text-gray-500'
            }`}>
              {isListening 
                ? '🎤 Tap to stop and send' 
                : isProcessing 
                  ? '⏳ Processing your request...'
                  : isSpeaking
                    ? '🔊 AI is speaking...'
                    : '🎙️ Tap to start speaking'
              }
            </p>
            
            {/* Quick action buttons */}
            {!isListening && !isProcessing && !isSpeaking && conversationHistory.length > 0 && (
              <div className="mt-3 flex justify-center gap-2 animate-fadeIn">
                <span className="text-[10px] text-gray-400">Quick: </span>
                {['My tasks', 'Pipeline', 'Create task'].map((quick, i) => (
                  <button 
                    key={i}
                    className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full transition-colors"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-shake { animation: shake 0.5s ease-in-out; }
        `}</style>
      </div>
    </div>
  );
}

export default VoiceAIAssistant;
