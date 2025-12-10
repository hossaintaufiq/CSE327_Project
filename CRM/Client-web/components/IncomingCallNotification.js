"use client";

import { Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function IncomingCallNotification({ 
  caller, 
  conversationTitle,
  onAccept, 
  onReject 
}) {
  const [ringing, setRinging] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play ringtone
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
    }

    // Auto-reject after 30 seconds
    const timeout = setTimeout(() => {
      onReject();
    }, 30000);

    return () => {
      clearTimeout(timeout);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onReject]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      {/* Ringtone audio */}
      <audio ref={audioRef} loop>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGA0fPTgjMGHm7A7+OZUB0OV6zo8bljHAY4kdfy" type="audio/wav" />
      </audio>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-green-500 p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Caller Avatar with pulse animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {caller?.name?.charAt(0) || "?"}
            </div>
          </div>
        </div>

        {/* Caller Info */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            Incoming Audio Call
          </h3>
          <p className="text-xl text-green-400 font-semibold mb-1">
            {caller?.name || "Unknown"}
          </p>
          <p className="text-sm text-gray-400">
            {conversationTitle || "Conversation"}
          </p>
        </div>

        {/* Call Actions */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 p-4 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-all transform hover:scale-110"
            title="Reject call"
          >
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <X className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm text-red-400 font-medium">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 p-4 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-all transform hover:scale-110 animate-pulse"
            title="Accept call"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm text-green-400 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
