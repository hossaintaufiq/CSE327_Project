"use client";

import { useEffect, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { X, Mic, MicOff, PhoneOff, Phone } from "lucide-react";

export default function AudioCallModal({ isOpen, onClose, callToken, roomName, identity, conversationId }) {
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [callState, setCallState] = useState("initializing"); // initializing, connecting, connected, disconnected, error
  const [callDuration, setCallDuration] = useState(0);
  const [remoteParticipant, setRemoteParticipant] = useState(null);

  useEffect(() => {
    if (!isOpen || !callToken || !identity) return;

    const initializeCall = async () => {
      try {
        setCallState("connecting");

        // Initialize Twilio Device with token
        const device = new Device(callToken, {
          codecPreferences: ["opus", "pcmu"],
          closeProtection: true,
          enableImprovedSignalingErrorPrecision: true
        });

        deviceRef.current = device;

        // Set up device event listeners
        device.on("registered", () => {
          console.log("Twilio Device registered");
          // Start outgoing call or wait for incoming
          makeOutgoingCall(device);
        });

        device.on("error", (error) => {
          console.error("Twilio Device error:", error);
          setCallState("error");
        });

        device.on("incoming", (call) => {
          console.log("Incoming call received");
          handleIncomingCall(call);
        });

        // Register the device
        await device.register();

      } catch (error) {
        console.error("Error initializing Twilio call:", error);
        setCallState("error");
      }
    };

    initializeCall();

    // Cleanup on unmount or close
    return () => {
      if (callRef.current) {
        callRef.current.disconnect();
        callRef.current = null;
      }
      if (deviceRef.current) {
        deviceRef.current.unregister();
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [isOpen, callToken, identity]);

  const makeOutgoingCall = async (device) => {
    try {
      // Make a call to the other participant
      const call = await device.connect({
        params: {
          To: roomName, // Use room name as destination
          Identity: identity
        }
      });

      callRef.current = call;
      console.log("Call object created:", call);

      // Set up call event listeners
      call.on("accept", (conn) => {
        console.log("Call accepted");
        setCallState("connected");
      });

      call.on("disconnect", (conn) => {
        console.log("Call disconnected");
        setCallState("disconnected");
        onClose();
      });

      call.on("cancel", () => {
        console.log("Call cancelled");
        setCallState("disconnected");
        onClose();
      });

      call.on("reject", () => {
        console.log("Call rejected");
        setCallState("disconnected");
        onClose();
      });

      call.on("error", (error) => {
        console.error("Call error:", error);
        setCallState("error");
      });

    } catch (error) {
      console.error("Error making outgoing call:", error);
      setCallState("error");
    }
  };

  const handleIncomingCall = (call) => {
    callRef.current = call;

    // Set up call event listeners first
    call.on("accept", (conn) => {
      console.log("Incoming call accepted");
      setCallState("connected");
      setRemoteParticipant({ name: "Participant" });
    });

    call.on("disconnect", (conn) => {
      console.log("Call disconnected");
      setCallState("disconnected");
      onClose();
    });

    call.on("cancel", () => {
      console.log("Call cancelled");
      setCallState("disconnected");
      onClose();
    });

    call.on("error", (error) => {
      console.error("Call error:", error);
      setCallState("error");
    });

    // Accept the incoming call
    call.accept();
  };

  const toggleAudio = () => {
    if (callRef.current) {
      const newMutedState = !isAudioMuted;
      callRef.current.mute(newMutedState);
      setIsAudioMuted(newMutedState);
    }
  };

  const leaveCall = async () => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    if (deviceRef.current) {
      deviceRef.current.unregister();
      deviceRef.current.destroy();
    }
    onClose();
  };

  // Track call duration
  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-full">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Audio Call</h2>
              <p className="text-sm text-gray-400">
                {callState === "connecting" && "Connecting..."}
                {callState === "connected" && formatDuration(callDuration)}
                {callState === "error" && "Connection error"}
              </p>
            </div>
          </div>
          <button
            onClick={leaveCall}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Call Status Display */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900 p-8">
          {callState === "connecting" && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative mb-6">
                <div className="animate-ping absolute h-24 w-24 rounded-full bg-green-400 opacity-20"></div>
                <div className="relative h-24 w-24 rounded-full bg-green-500/30 flex items-center justify-center">
                  <Phone className="w-12 h-12 text-green-400 animate-pulse" />
                </div>
              </div>
              <p className="text-white text-lg font-medium">Connecting to call...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait</p>
            </div>
          )}

          {callState === "connected" && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative mb-6">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                  <Phone className="w-16 h-16 text-white" />
                </div>
                {/* Audio wave animation */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <div className="w-1 bg-green-400 rounded-full animate-pulse" style={{height: '8px', animationDelay: '0ms'}}></div>
                  <div className="w-1 bg-green-400 rounded-full animate-pulse" style={{height: '12px', animationDelay: '150ms'}}></div>
                  <div className="w-1 bg-green-400 rounded-full animate-pulse" style={{height: '16px', animationDelay: '300ms'}}></div>
                  <div className="w-1 bg-green-400 rounded-full animate-pulse" style={{height: '12px', animationDelay: '450ms'}}></div>
                  <div className="w-1 bg-green-400 rounded-full animate-pulse" style={{height: '8px', animationDelay: '600ms'}}></div>
                </div>
              </div>
              <p className="text-white text-xl font-bold">{formatDuration(callDuration)}</p>
              <p className="text-gray-400 text-sm mt-1">Call in progress</p>
            </div>
          )}

          {callState === "error" && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="h-24 w-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <X className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-red-400 text-lg font-medium mb-4">Failed to connect to call</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        {callState === "joined" && (
          <div className="p-6 bg-gray-800 flex items-center justify-center gap-6">
            {/* Mute/Unmute Audio */}
            <button
              onClick={toggleAudio}
              className={`p-5 rounded-full transition-all transform hover:scale-105 ${
                isAudioMuted
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isAudioMuted ? "Unmute" : "Mute"}
            >
              {isAudioMuted ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>

            {/* Leave Call */}
            <button
              onClick={leaveCall}
              className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all transform hover:scale-105"
              title="End call"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
