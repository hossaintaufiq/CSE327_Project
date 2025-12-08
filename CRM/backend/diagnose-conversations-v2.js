import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Conversation } from './src/models/Conversation.js';
import { User } from './src/models/User.js';
import { Company } from './src/models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n--- All Conversations ---');
    const conversations = await Conversation.find({}).lean();
    console.log(`Total conversations: ${conversations.length}`);
    
    for (const c of conversations) {
      console.log(`ID: ${c._id}`);
      console.log(`  Client: ${c.clientUserId}`);
      console.log(`  Company: ${c.companyId}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Active: ${c.isActive}`);
      console.log(`  Messages: ${c.messages?.length || 0}`);
    }

    console.log('\n--- Users with Company Roles ---');
    const users = await User.find({ 'companies.0': { $exists: true } }).select('name email companies').lean();
    for (const u of users) {
      console.log(`User: ${u.name} (${u.email})`);
      for (const c of u.companies) {
        console.log(`  - Company: ${c.companyId}, Role: ${c.role}, Active: ${c.isActive}`);
      }
    }

  } catch (error) {
    console.error('Diagnosis error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
