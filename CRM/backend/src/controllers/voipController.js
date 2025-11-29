import {
  makeCall,
  sendSMS,
  generateVoiceToken,
  getCallLogs,
  endCall,
  getTwilioClient,
} from '../services/twilioService.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get voice token for client-side calling
 */
export const getVoiceToken = async (req, res) => {
  try {
    const user = req.user;
    const identity = `user_${user._id}`;

    const token = generateVoiceToken(identity);

    res.json({
      success: true,
      data: {
        token,
        identity,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating voice token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate voice token',
    });
  }
};

/**
 * Make outbound call
 */
export const makeOutboundCall = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { to, leadId, clientId, notes } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/[\s-]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    const callbackUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voip/webhook/voice`;
    const statusCallback = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voip/webhook/status`;

    const result = await makeCall(to, callbackUrl, { statusCallback });

    // Log the call activity
    await ActivityLog.create({
      userId: user._id,
      companyId,
      action: 'call_initiated',
      description: `Outbound call initiated to ${to}`,
      metadata: {
        callSid: result.callSid,
        to,
        leadId,
        clientId,
        notes,
      },
      severity: 'info',
    });

    res.json({
      success: true,
      data: result,
      message: 'Call initiated successfully',
    });
  } catch (error) {
    console.error('Error making outbound call:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate call',
    });
  }
};

/**
 * End active call
 */
export const endActiveCall = async (req, res) => {
  try {
    const { callSid } = req.params;

    if (!callSid) {
      return res.status(400).json({
        success: false,
        message: 'Call SID is required',
      });
    }

    const result = await endCall(callSid);

    res.json({
      success: true,
      data: result,
      message: 'Call ended successfully',
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end call',
    });
  }
};

/**
 * Get call history
 */
export const getCallHistory = async (req, res) => {
  try {
    const { limit, to, from, startTime, endTime } = req.query;

    const calls = await getCallLogs({
      limit: parseInt(limit) || 50,
      to,
      from,
      startTime,
      endTime,
    });

    res.json({
      success: true,
      data: { calls },
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch call history',
    });
  }
};

/**
 * Send SMS message
 */
export const sendSMSMessage = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    const { to, body, leadId, clientId } = req.body;

    if (!to || !body) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message body are required',
      });
    }

    const result = await sendSMS(to, body);

    // Log the SMS activity
    await ActivityLog.create({
      userId: user._id,
      companyId,
      action: 'sms_sent',
      description: `SMS sent to ${to}`,
      metadata: {
        messageSid: result.messageSid,
        to,
        leadId,
        clientId,
        bodyPreview: body.substring(0, 50),
      },
      severity: 'info',
    });

    res.json({
      success: true,
      data: result,
      message: 'SMS sent successfully',
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS',
    });
  }
};

/**
 * Handle Twilio voice webhook
 */
export const handleVoiceWebhook = async (req, res) => {
  try {
    const VoiceResponse = (await import('twilio')).default.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Default greeting for inbound calls
    twiml.say(
      { voice: 'alice' },
      'Thank you for calling. Please wait while we connect you to an agent.'
    );

    // Add hold music or transfer logic here
    twiml.play({ loop: 5 }, 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B4.mp3');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling voice webhook:', error);
    res.status(500).send('Error processing call');
  }
};

/**
 * Handle Twilio status callback
 */
export const handleStatusCallback = async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, To, From } = req.body;

    console.log(`Call ${CallSid} status: ${CallStatus}`);

    // Update call log in activity log
    if (CallStatus === 'completed') {
      await ActivityLog.findOneAndUpdate(
        { 'metadata.callSid': CallSid },
        {
          $set: {
            'metadata.status': CallStatus,
            'metadata.duration': CallDuration,
          },
        }
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling status callback:', error);
    res.status(500).send('Error');
  }
};
