"use client";

import { useEffect, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import api from "@/utils/api";

/**
 * Hook to manage persistent Twilio Device registration
 * Keeps Device registered while user is on the page to receive incoming calls
 */
export function useTwilioDevice(conversationId, onIncomingCall) {
  const deviceRef = useRef(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    let tokenRefreshInterval;

    const initializeDevice = async () => {
      try {
        // Get Twilio token for this conversation
        const res = await api.post(`/audio-calls/${conversationId}/create`);
        
        if (!mounted) return;
        
        if (!res.data?.success) {
          console.log('[useTwilioDevice] Failed to get token:', res.data?.message);
          return;
        }

        const { token, identity } = res.data.data;
        console.log('[useTwilioDevice] Got token, registering Device for identity:', identity);

        // Create and configure Device
        const device = new Device(token, {
          codecPreferences: ["opus", "pcmu"],
          closeProtection: true,
          enableImprovedSignalingErrorPrecision: true,
          logLevel: 1 // Info level logging
        });

        deviceRef.current = device;

        // Device event handlers
        device.on("registered", () => {
          console.log('[useTwilioDevice] Device registered successfully');
          if (mounted) setIsRegistered(true);
        });

        device.on("unregistered", () => {
          console.log('[useTwilioDevice] Device unregistered');
          if (mounted) setIsRegistered(false);
        });

        device.on("error", (error) => {
          console.error('[useTwilioDevice] Device error:', error);
          if (mounted) setError(error.message);
        });

        device.on("incoming", (call) => {
          console.log('[useTwilioDevice] Incoming call received!');
          if (onIncomingCall) {
            onIncomingCall(call);
          }
        });

        device.on("tokenWillExpire", async () => {
          console.log('[useTwilioDevice] Token expiring, refreshing...');
          try {
            const refreshRes = await api.post(`/audio-calls/${conversationId}/create`);
            if (refreshRes.data?.success) {
              device.updateToken(refreshRes.data.data.token);
              console.log('[useTwilioDevice] Token refreshed');
            }
          } catch (err) {
            console.error('[useTwilioDevice] Failed to refresh token:', err);
          }
        });

        // Register the device
        await device.register();

        // Refresh token every 50 minutes (tokens expire after 1 hour)
        tokenRefreshInterval = setInterval(async () => {
          try {
            const refreshRes = await api.post(`/audio-calls/${conversationId}/create`);
            if (refreshRes.data?.success && deviceRef.current) {
              deviceRef.current.updateToken(refreshRes.data.data.token);
              console.log('[useTwilioDevice] Token auto-refreshed');
            }
          } catch (err) {
            console.error('[useTwilioDevice] Auto-refresh failed:', err);
          }
        }, 50 * 60 * 1000); // 50 minutes

      } catch (error) {
        console.error('[useTwilioDevice] Initialization error:', error);
        if (mounted) setError(error.message);
      }
    };

    initializeDevice();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      if (deviceRef.current) {
        console.log('[useTwilioDevice] Cleaning up Device');
        deviceRef.current.unregister();
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [conversationId, onIncomingCall]);

  return {
    device: deviceRef.current,
    isRegistered,
    error
  };
}
