import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);

import { User } from './src/models/User.js';
import { Conversation } from './src/models/Conversation.js';
import { Company } from './src/models/Company.js';

dotenv.config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n--- Users ---');
    const users = await User.find({}).select('name email firebaseUid role');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, UID: ${u.firebaseUid}`);
    });

    console.log('\n--- Companies ---');
    const companies = await Company.find({}).select('name');
    companies.forEach(c => {
      console.log(`ID: ${c._id}, Name: ${c.name}`);
    });

    console.log('\n--- Conversations ---');
    const conversations = await Conversation.find({});
    console.log(`Total conversations: ${conversations.length}`);
    
    for (const c of conversations) {
      console.log(`ID: ${c._id}`);
      console.log(`  Client: ${c.clientUserId}`);
      console.log(`  Company: ${c.companyId}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Active: ${c.isActive}`);
      console.log(`  Messages: ${c.messages.length}`);
      
      // Check if client exists
      const client = await User.findById(c.clientUserId);
      console.log(`  Client Exists: ${!!client} ${client ? '(' + client.email + ')' : ''}`);
    }

  } catch (error) {
    console.error('Diagnosis error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
