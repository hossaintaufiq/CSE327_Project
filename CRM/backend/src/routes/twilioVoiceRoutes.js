import express from 'express';
import twilio from 'twilio';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * TwiML endpoint for handling incoming voice calls
 * This is called by Twilio when a call is initiated from the Voice SDK
 */
router.post('/voice', (req, res) => {
  const { To, From } = req.body;
  
  console.log('[TwiML Voice] Call request:', { To, From });
  
  const response = new VoiceResponse();
  
  // Create a dial verb to connect two participants
  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER,
    timeout: 30,
    record: 'do-not-record'
  });
  
  // Dial the other participant using their client identity
  dial.client(To);
  
  res.type('text/xml');
  res.send(response.toString());
});

/**
 * Status callback endpoint for call events
 */
router.post('/voice/status', (req, res) => {
  const { CallSid, CallStatus, To, From } = req.body;
  console.log(`[TwiML Status] Call ${CallSid}: ${CallStatus} (${From} -> ${To})`);
  res.sendStatus(200);
});

export default router;
