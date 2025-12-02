'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { voiceChatApi } from '../utils/api';
import { useSocket } from './useSocket';

/**
 * React hook for voice chat functionality
 * 
 * Provides:
 * - Call initiation
 * - Call answering/declining
 * - Incoming call notifications
 * - Call state management
 */
export function useVoiceChat() {
  const { socket, isConnected } = useSocket();
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, in-call
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [error, setError] = useState(null);
  
  const iframeRef = useRef(null);

  // Check if voice chat is enabled
  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await voiceChatApi.getStatus();
        setVoiceChatEnabled(result.data?.enabled || false);
      } catch (err) {
        setVoiceChatEnabled(false);
      }
    }
    checkStatus();
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingCall = (data) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
      setCallState('ringing');
    };

    const handleGroupInvite = (data) => {
      console.log('Group call invite:', data);
      setIncomingCall(data);
      setCallState('ringing');
    };

    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      if (currentCall?.callId === data.roomName) {
        endCallLocally();
      }
    };

    const handleCallDeclined = (data) => {
      console.log('Call declined:', data);
      if (currentCall?.callId === data.roomName) {
        setError(`Call declined: ${data.reason}`);
        endCallLocally();
      }
    };

    const handleCallAnswered = (data) => {
      console.log('Call answered:', data);
      if (callState === 'calling') {
        setCallState('in-call');
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:group-invite', handleGroupInvite);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:declined', handleCallDeclined);
    socket.on('call:answered', handleCallAnswered);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:group-invite', handleGroupInvite);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:declined', handleCallDeclined);
      socket.off('call:answered', handleCallAnswered);
    };
  }, [socket, isConnected, currentCall, callState]);

  // End call locally
  const endCallLocally = useCallback(() => {
    setCurrentCall(null);
    setIncomingCall(null);
    setCallState('idle');
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async (recipientId, recipientName) => {
    if (!voiceChatEnabled) {
      setError('Voice chat is not enabled');
      return null;
    }

    try {
      setError(null);
      setCallState('calling');

      const result = await voiceChatApi.initiateCall(recipientId, recipientName);
      
      if (result.success) {
        setCurrentCall({
          callId: result.data.callId,
          roomUrl: result.data.roomUrl,
          token: result.data.token,
          recipientId,
          recipientName,
        });
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to initiate call');
      }
    } catch (err) {
      setError(err.message);
      setCallState('idle');
      return null;
    }
  }, [voiceChatEnabled]);

  // Create a group call
  const createGroupCall = useCallback(async (name, participants) => {
    if (!voiceChatEnabled) {
      setError('Voice chat is not enabled');
      return null;
    }

    try {
      setError(null);
      setCallState('calling');

      const result = await voiceChatApi.createGroupCall(name, participants);
      
      if (result.success) {
        setCurrentCall({
          callId: result.data.callId,
          roomUrl: result.data.roomUrl,
          token: result.data.token,
          isGroupCall: true,
          participantCount: result.data.participantCount,
        });
        setCallState('in-call');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create group call');
      }
    } catch (err) {
      setError(err.message);
      setCallState('idle');
      return null;
    }
  }, [voiceChatEnabled]);

  // Answer an incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCall) {
      setError('No incoming call to answer');
      return null;
    }

    try {
      setError(null);

      const result = await voiceChatApi.answerCall(incomingCall.callId);
      
      if (result.success) {
        setCurrentCall({
          callId: incomingCall.callId,
          roomUrl: result.data.roomUrl,
          token: result.data.token,
          caller: incomingCall.caller,
        });
        setIncomingCall(null);
        setCallState('in-call');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to answer call');
      }
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [incomingCall]);

  // Decline an incoming call
  const declineCall = useCallback(async (reason = 'User busy') => {
    if (!incomingCall) {
      return;
    }

    try {
      await voiceChatApi.declineCall(incomingCall.callId, reason);
    } catch (err) {
      console.error('Error declining call:', err);
    } finally {
      setIncomingCall(null);
      setCallState('idle');
    }
  }, [incomingCall]);

  // End current call
  const endCall = useCallback(async () => {
    if (!currentCall) {
      return;
    }

    try {
      await voiceChatApi.endCall(currentCall.callId);
    } catch (err) {
      console.error('Error ending call:', err);
    } finally {
      endCallLocally();
    }
  }, [currentCall, endCallLocally]);

  // Open call in iframe
  const openCallWindow = useCallback(() => {
    if (!currentCall?.roomUrl) return null;

    // Return the room URL for embedding in an iframe or opening in new window
    return currentCall.roomUrl;
  }, [currentCall]);

  return {
    // State
    callState,
    currentCall,
    incomingCall,
    voiceChatEnabled,
    error,
    isInCall: callState === 'in-call',
    isRinging: callState === 'ringing',
    isCalling: callState === 'calling',

    // Actions
    initiateCall,
    createGroupCall,
    answerCall,
    declineCall,
    endCall,
    openCallWindow,
    clearError: () => setError(null),
  };
}

export default useVoiceChat;
