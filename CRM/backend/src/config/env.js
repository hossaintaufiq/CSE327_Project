import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

// Export commonly used env vars for convenience
export const {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  DAILY_API_KEY,
  NODE_ENV,
  GEMINI_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TELEGRAM_BOT_TOKEN,
} = process.env;

// Log critical missing environment variables
if (!DAILY_API_KEY) {
  console.warn('[ENV] WARNING: DAILY_API_KEY is not configured');
}

if (!GEMINI_API_KEY) {
  console.warn('[ENV] WARNING: GEMINI_API_KEY is not configured');
}

console.log('[ENV] Environment variables loaded successfully');
