'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * React hook for Voice AI interaction
 * 
 * Uses Web Speech API for speech-to-text and text-to-speech,
 * and Socket.io for real-time AI responses.
 */
export function useVoiceAI() {
  const { socket, isConnected } = useSocket();
  
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    setIsSupported(!!(SpeechRecognition && speechSynthesis));
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        
        setInterimTranscript(interim);
        if (final) {
          setTranscript(prev => prev + final);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    synthesisRef.current = speechSynthesis;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReady = (data) => {
      setSessionId(data.sessionId);
      setError(null);
    };

    const handleResponse = (data) => {
      setIsProcessing(false);
      setResponse(data);
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text: transcript },
        { role: 'assistant', text: data.text, action: data.action },
      ]);
      
      // Speak the response
      if (data.text) {
        speak(data.text);
      }
      
      // Clear transcript for next input
      setTranscript('');
    };

    const handleError = (data) => {
      setIsProcessing(false);
      setError(data.message || 'An error occurred');
    };

    const handleEnded = (data) => {
      setSessionId(null);
    };

    const handleCleared = () => {
      setConversationHistory([]);
    };

    socket.on('voice:ready', handleReady);
    socket.on('voice:response', handleResponse);
    socket.on('voice:error', handleError);
    socket.on('voice:ended', handleEnded);
    socket.on('voice:cleared', handleCleared);

    return () => {
      socket.off('voice:ready', handleReady);
      socket.off('voice:response', handleResponse);
      socket.off('voice:error', handleError);
      socket.off('voice:ended', handleEnded);
      socket.off('voice:cleared', handleCleared);
    };
  }, [socket, isConnected, transcript]);

  // Start voice session
  const startSession = useCallback(() => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }
    
    const newSessionId = `voice-${Date.now()}`;
    socket.emit('voice:start', { sessionId: newSessionId });
    setSessionId(newSessionId);
    setConversationHistory([]);
  }, [socket, isConnected]);

  // End voice session
  const endSession = useCallback(() => {
    if (socket && sessionId) {
      socket.emit('voice:end');
    }
    stopListening();
    setSessionId(null);
  }, [socket, sessionId]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (!sessionId) {
      startSession();
    }
    
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [sessionId, startSession]);

  // Stop listening and process
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Send text to AI
  const sendText = useCallback((text) => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }
    
    if (!text?.trim()) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    socket.emit('voice:text', {
      text: text.trim(),
      sessionId,
    });
  }, [socket, isConnected, sessionId]);

  // Process current transcript
  const processTranscript = useCallback(() => {
    stopListening();
    if (transcript.trim()) {
      sendText(transcript);
    }
  }, [stopListening, transcript, sendText]);

  // Text-to-speech
  const speak = useCallback((text) => {
    if (!synthesisRef.current) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a natural voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Natural') ||
      v.name.includes('Samantha')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (socket) {
      socket.emit('voice:clear');
    }
    setConversationHistory([]);
    setResponse(null);
    setTranscript('');
  }, [socket]);

  // Toggle listening (push-to-talk)
  const toggleListening = useCallback(() => {
    if (isListening) {
      processTranscript();
    } else {
      startListening();
    }
  }, [isListening, processTranscript, startListening]);

  return {
    // State
    isListening,
    isProcessing,
    isSpeaking,
    isSupported,
    isSessionActive: !!sessionId,
    transcript,
    interimTranscript,
    fullTranscript: transcript + interimTranscript,
    response,
    error,
    sessionId,
    conversationHistory,
    
    // Actions
    startSession,
    endSession,
    startListening,
    stopListening,
    toggleListening,
    processTranscript,
    sendText,
    speak,
    stopSpeaking,
    clearConversation,
    clearError: () => setError(null),
  };
}

export default useVoiceAI;
