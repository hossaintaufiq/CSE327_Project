'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceChat } from '@/lib/useVoiceChat';

/**
 * Voice Call Modal Component
 * 
 * Displays:
 * - Incoming call notification with accept/decline
 * - Outgoing call waiting screen
 * - Active call with Daily.co iframe
 */
export function VoiceCallModal() {
  const {
    callState,
    currentCall,
    incomingCall,
    error,
    isInCall,
    isRinging,
    isCalling,
    answerCall,
    declineCall,
    endCall,
    openCallWindow,
    clearError,
  } = useVoiceChat();

  const iframeRef = useRef(null);
  const [minimized, setMinimized] = useState(false);

  // Don't render if no active call state
  if (callState === 'idle' && !error) {
    return null;
  }

  // Incoming call notification
  if (isRinging && incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-pulse">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Incoming {incomingCall.name ? 'Group ' : ''}Call
            </h3>
            <p className="text-gray-600 mb-6">
              {incomingCall.caller?.name || incomingCall.organizer?.name || 'Someone'} is calling...
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={declineCall}
                className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </button>
              <button
                onClick={answerCall}
                className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Answer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calling (waiting for answer)
  if (isCalling) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Calling...</h3>
            <p className="text-gray-600 mb-6">
              Waiting for {currentCall?.recipientName || 'recipient'} to answer
            </p>

            <button
              onClick={endCall}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call
  if (isInCall && currentCall) {
    const roomUrl = openCallWindow();

    if (minimized) {
      return (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl p-4 flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Call in progress</span>
            <button
              onClick={() => setMinimized(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={endCall}
              className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors text-sm"
            >
              End
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="w-full max-w-4xl h-[80vh] bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">
                {currentCall.isGroupCall ? 'Group Call' : `Call with ${currentCall.recipientName || currentCall.caller?.name || 'User'}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinimized(true)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={endCall}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                End Call
              </button>
            </div>
          </div>

          {/* Call iframe */}
          <div className="flex-1 bg-black">
            {roomUrl ? (
              <iframe
                ref={iframeRef}
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Voice Call"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>Loading call...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default VoiceCallModal;
