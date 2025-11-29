import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

/**
 * Initialize Twilio client
 */
export const initTwilioClient = () => {
  if (!accountSid || !authToken) {
    console.log('⚠️ Twilio credentials not configured - VoIP disabled');
    return false;
  }
  
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error.message);
    return false;
  }
};

/**
 * Get Twilio client
 */
export const getTwilioClient = () => {
  if (!client) {
    initTwilioClient();
  }
  return client;
};

/**
 * Make an outbound call
 * @param {string} to - Phone number to call
 * @param {string} callbackUrl - URL for TwiML instructions
 * @param {object} options - Additional options
 */
export const makeCall = async (to, callbackUrl, options = {}) => {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const callOptions = {
    to,
    from: twilioPhoneNumber,
    url: callbackUrl,
    statusCallback: options.statusCallback,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    ...options,
  };

  const call = await client.calls.create(callOptions);
  return {
    success: true,
    callSid: call.sid,
    status: call.status,
    to: call.to,
    from: call.from,
  };
};

/**
 * Send SMS message
 * @param {string} to - Phone number to send to
 * @param {string} body - Message content
 */
export const sendSMS = async (to, body) => {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const message = await client.messages.create({
    body,
    to,
    from: twilioPhoneNumber,
  });

  return {
    success: true,
    messageSid: message.sid,
    status: message.status,
  };
};

/**
 * Get call logs
 * @param {object} filters - Filter options
 */
export const getCallLogs = async (filters = {}) => {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const options = {
    limit: filters.limit || 50,
  };

  if (filters.to) options.to = filters.to;
  if (filters.from) options.from = filters.from;
  if (filters.startTime) options.startTimeAfter = new Date(filters.startTime);
  if (filters.endTime) options.startTimeBefore = new Date(filters.endTime);

  const calls = await client.calls.list(options);
  return calls.map(call => ({
    sid: call.sid,
    to: call.to,
    from: call.from,
    status: call.status,
    direction: call.direction,
    duration: call.duration,
    startTime: call.startTime,
    endTime: call.endTime,
    price: call.price,
  }));
};

/**
 * Generate access token for client-side voice calls
 * @param {string} identity - User identity
 */
export const generateVoiceToken = (identity) => {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
  if (!twimlAppSid) {
    throw new Error('Twilio TwiML App SID not configured');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  const token = new AccessToken(
    accountSid,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { identity }
  );

  token.addGrant(voiceGrant);
  return token.toJwt();
};

/**
 * End an active call
 * @param {string} callSid - Call SID to end
 */
export const endCall = async (callSid) => {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const call = await client.calls(callSid).update({ status: 'completed' });
  return {
    success: true,
    callSid: call.sid,
    status: call.status,
  };
};
