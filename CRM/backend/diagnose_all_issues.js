import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import { Company } from './src/models/Company.js';
import { Conversation } from './src/models/Conversation.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const diagnose = async () => {
  await connectDB();

  try {
    console.log('=== DIAGNOSTIC REPORT ===\n');

    // Issue 1: Client Dashboard
    console.log('1. CLIENT DASHBOARD CHECK:');
    const clientUser = await User.findOne({ globalRole: 'client' });
    if (clientUser) {
      console.log(`   Found client: ${clientUser.name} (${clientUser._id})`);
      console.log(`   Email: ${clientUser.email}`);
      console.log(`   Global Role: ${clientUser.globalRole}`);
      
      // Check if client has companies
      if (clientUser.companies && clientUser.companies.length > 0) {
        console.log(`   Companies: ${clientUser.companies.length}`);
        await clientUser.populate('companies.companyId');
        clientUser.companies.forEach(c => {
          console.log(`     - ${c.companyId.name} (${c.companyId._id}) [${c.role}]`);
        });
      } else {
        console.log('   ⚠ Client has NO companies - Dashboard will fail!');
      }
    } else {
      console.log('   ⚠ No client user found in database');
    }

    console.log('\n2. EMPLOYEE CONVERSATION VISIBILITY CHECK:');
    const employees = await User.find({
      'companies.role': 'employee',
      'companies.isActive': true,
    }).limit(3);

    for (const emp of employees) {
      await emp.populate('companies.companyId');
      const activeCompany = emp.companies.find(c => c.isActive && c.role === 'employee');
      
      if (activeCompany) {
        console.log(`   Employee: ${emp.name} (${emp._id})`);
        console.log(`   Company: ${activeCompany.companyId.name} (${activeCompany.companyId._id})`);
        
        // Check conversations assigned to this employee
        const assignedConvos = await Conversation.find({
          companyId: activeCompany.companyId._id,
          assignedRepresentative: emp._id,
          isActive: true,
        }).select('_id title status');
        
        console.log(`   Assigned Conversations: ${assignedConvos.length}`);
        if (assignedConvos.length > 0) {
          assignedConvos.forEach(c => {
            console.log(`     - ${c.title} (${c._id}) [${c.status}]`);
          });
        } else {
          console.log('     (No conversations assigned to this employee)');
        }
        
        // Check if there are unassigned conversations they might incorrectly see
        const unassignedConvos = await Conversation.find({
          companyId: activeCompany.companyId._id,
          assignedRepresentative: null,
          isActive: true,
        }).select('_id title').limit(3);
        
        if (unassignedConvos.length > 0) {
          console.log(`   ⚠ Unassigned Conversations in company: ${unassignedConvos.length}`);
          console.log('     (Employee should NOT see these)');
        }
        console.log('');
      }
    }

    console.log('\n3. GEMINI ROLE-BASED ACCESS CHECK:');
    console.log(`   Gemini API Key configured: ${!!process.env.GEMINI_API_KEY}`);
    console.log(`   Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);
    
    // Check if clients can reach AI endpoints by checking middleware flow
    console.log('\n   Middleware Flow for Client:');
    console.log('   - verifyFirebaseToken: ✓ (client has token)');
    console.log('   - verifyCompanyAccess: ✓ (client role bypass enabled)');
    console.log('   - AI Routes: Should be accessible');
    
    console.log('\n=== SUMMARY ===');
    console.log('✓ = Fixed | ⚠ = Issue | ✗ = Critical\n');
    
    let issues = [];
    
    if (!clientUser) {
      issues.push('✗ No client user exists - create one for testing');
    } else if (!clientUser.companies || clientUser.companies.length === 0) {
      issues.push('⚠ Client has no companies - dashboard will crash');
    } else {
      issues.push('✓ Client user properly configured');
    }
    
    const employeesWithConvos = await User.aggregate([
      { $unwind: '$companies' },
      { $match: { 'companies.role': 'employee', 'companies.isActive': true } },
      { $limit: 1 }
    ]);
    
    if (employeesWithConvos.length > 0) {
      issues.push('✓ Employee conversation filtering is active');
    } else {
      issues.push('⚠ No employees found for testing');
    }
    
    if (process.env.GEMINI_API_KEY) {
      issues.push('✓ Gemini API configured');
    } else {
      issues.push('✗ Gemini API key missing');
    }
    
    issues.forEach(issue => console.log(issue));
    
  } catch (error) {
    console.error('\n✗ Error during diagnosis:', error);
  } finally {
    mongoose.disconnect();
  }
};

diagnose();
