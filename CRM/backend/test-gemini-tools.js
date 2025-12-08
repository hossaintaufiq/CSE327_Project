import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as geminiService from './src/services/geminiService.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testTools() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const prompt = "Find clients with status 'lead'";
    const companyId = "69208b312f240fa22bd2e21c"; // Izzy
    const userId = "692f2414dedb87966c916240"; // sakibClient

    console.log(`Testing Gemini with tools. Prompt: "${prompt}"`);
    
    const response = await geminiService.generateWithTools(prompt, companyId, userId);
    
    console.log('\n--- AI Response ---');
    console.log(response);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTools();
