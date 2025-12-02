/**
 * Socket.io Client Hook
 * 
 * React hook for managing Socket.io connection for live chat.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  
  const { user, companyId } = useAuthStore();

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id || !companyId) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);

      // Join user's room
      socket.emit('user:join', {
        userId: user._id,
        companyId,
        name: user.name,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Online users
    socket.on('users:online', ({ users }) => {
      setOnlineUsers(users);
    });

    socket.on('user:online', ({ userId, name }) => {
      setOnlineUsers((prev) => {
        if (!prev.find((u) => u.userId === userId)) {
          return [...prev, { userId, name }];
        }
        return prev;
      });
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Typing indicators
    socket.on('typing:update', ({ userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [userId]: userName };
        }
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, companyId]);

  // Send message
  const sendMessage = useCallback(
    (recipientId, content, messageType = 'direct') => {
      if (!socketRef.current || !isConnected) return false;

      socketRef.current.emit('message:send', {
        senderId: user._id,
        recipientId,
        companyId,
        content,
        messageType,
      });

      return true;
    },
    [user?._id, companyId, isConnected]
  );

  // Start typing indicator
  const startTyping = useCallback(
    (recipientId) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('typing:start', {
        userId: user._id,
        userName: user.name,
        companyId,
        recipientId,
      });
    },
    [user?._id, user?.name, companyId, isConnected]
  );

  // Stop typing indicator
  const stopTyping = useCallback(
    (recipientId) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('typing:stop', {
        userId: user._id,
        companyId,
        recipientId,
      });
    },
    [user?._id, companyId, isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (messageIds) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('message:read', {
        messageIds,
        readerId: user._id,
      });
    },
    [user?._id, isConnected]
  );

  // Subscribe to new messages
  const onMessage = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on('message:receive', callback);
    return () => socketRef.current?.off('message:receive', callback);
  }, []);

  // Subscribe to message sent confirmation
  const onMessageSent = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on('message:sent', callback);
    return () => socketRef.current?.off('message:sent', callback);
  }, []);

  // Subscribe to read receipts
  const onReadReceipt = useCallback((callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on('message:read', callback);
    return () => socketRef.current?.off('message:read', callback);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    onMessage,
    onMessageSent,
    onReadReceipt,
  };
}

export default useSocket;
