import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as geminiService from './src/services/geminiService.js';
import mongoose from 'mongoose';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testTools() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load credentials from test-config.json if available
    let companyId, userId;
    
    try {
      const testConfig = JSON.parse(fs.readFileSync('./test-config.json', 'utf-8'));
      if (testConfig.credentials.admin?.activeCompany?.companyId) {
        companyId = testConfig.credentials.admin.activeCompany.companyId;
        userId = testConfig.credentials.admin.userId;
        console.log(`✅ Using credentials from test-config.json`);
        console.log(`   Company ID: ${companyId}`);
        console.log(`   User ID: ${userId}`);
      }
    } catch (error) {
      console.log('⚠️  No test-config.json found, using fallback IDs');
    }

    // Fallback to hardcoded IDs or use command line arguments
    if (!companyId || !userId) {
      companyId = process.argv[2] || "69208b312f240fa22bd2e21c"; // Fallback
      userId = process.argv[3] || "692f2414dedb87966c916240"; // Fallback
      console.log(`⚠️  Using fallback credentials:`);
      console.log(`   Company ID: ${companyId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`\n💡 TIP: Generate proper credentials with:`);
      console.log(`   node test-credentials-generator.js --login email password`);
    }

    const prompt = process.argv[4] || "Find clients with status 'lead'";

    console.log(`\n🤖 Testing Gemini with tools`);
    console.log(`   Prompt: "${prompt}"`);
    
    const response = await geminiService.generateWithTools(prompt, companyId, userId);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📝 AI Response:');
    console.log('═'.repeat(60));
    console.log(response);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testTools();
