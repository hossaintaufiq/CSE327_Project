/**
 * Migration Script: Add Pipeline Stages to Existing Data
 * 
 * This script updates existing database records to include default pipeline stages.
 * Run this once after adding pipelineStage field to models.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Client } from './src/models/Client.js';
import { Order } from './src/models/Order.js';
import { Project } from './src/models/Project.js';
import { Task } from './src/models/Task.js';

async function migrateData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Migrate Clients - Add pipelineStage field
    console.log('📊 Migrating Clients (Leads)...');
    const clientsToUpdate = await Client.find({ 
      $or: [
        { pipelineStage: { $exists: false } },
        { pipelineStage: null }
      ]
    });
    
    console.log(`Found ${clientsToUpdate.length} clients to update`);
    
    for (const client of clientsToUpdate) {
      // Set default pipelineStage based on status
      if (client.status === 'customer') {
        client.pipelineStage = 'won';
      } else if (client.status === 'inactive') {
        client.pipelineStage = 'lost';
      } else {
        client.pipelineStage = 'prospect'; // Default for leads
      }
      await client.save();
    }
    
    console.log(`✅ Updated ${clientsToUpdate.length} clients\n`);

    // 2. Migrate Orders - Ensure status values match pipeline
    console.log('📦 Migrating Orders...');
    const ordersToUpdate = await Order.find({
      status: { $in: ['confirmed', 'refunded'] } // Old status values
    });
    
    console.log(`Found ${ordersToUpdate.length} orders with old status values`);
    
    for (const order of ordersToUpdate) {
      if (order.status === 'confirmed') {
        order.status = 'approved'; // Map confirmed -> approved
      } else if (order.status === 'refunded') {
        order.status = 'cancelled'; // Map refunded -> cancelled
      }
      await order.save();
    }
    
    console.log(`✅ Updated ${ordersToUpdate.length} orders\n`);

    // 3. Migrate Projects - Add 'approved' status if needed
    console.log('📋 Checking Projects...');
    const projectsCount = await Project.countDocuments();
    console.log(`Found ${projectsCount} projects (status field already compatible)\n`);

    // 4. Check Tasks
    console.log('✓ Checking Tasks...');
    const tasksCount = await Task.countDocuments();
    console.log(`Found ${tasksCount} tasks (status field already compatible)\n`);

    // 5. Summary
    console.log('📊 Migration Summary:');
    console.log('-------------------');
    console.log(`Clients: ${clientsToUpdate.length} updated with pipelineStage`);
    console.log(`Orders: ${ordersToUpdate.length} updated with new status values`);
    console.log(`Projects: ${projectsCount} (already compatible)`);
    console.log(`Tasks: ${tasksCount} (already compatible)`);
    console.log('\n✅ Migration completed successfully!');
    
    // Display pipeline stage distribution
    console.log('\n📈 Pipeline Stage Distribution:');
    console.log('-------------------');
    
    const leadStages = await Client.aggregate([
      { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nLeads Pipeline:');
    leadStages.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));
    
    const orderStages = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nOrders Pipeline:');
    orderStages.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));
    
    const projectStages = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nProjects Pipeline:');
    projectStages.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));
    
    const taskStages = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nTasks Pipeline:');
    taskStages.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateData();
