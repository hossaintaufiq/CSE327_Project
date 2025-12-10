# Quick Start: Pipeline Database Migration

## ⚡ Run This Now to Fix Pipeline

### Step 1: Navigate to backend folder
```bash
cd f:\CODES\CSE327_Project\CRM\backend
```

### Step 2: Run migration script
```bash
node migrate-pipeline-data.js
```

### Step 3: Restart backend server
Press `Ctrl+C` in your terminal running the backend, then:
```bash
npm run dev
```

### Step 4: Test the pipeline
1. Open browser: http://localhost:3000/pipeline
2. Login as company admin (not super admin)
3. You should now see real data in the pipeline!

## What the Migration Does

✅ Adds `pipelineStage` field to all existing clients (leads)
✅ Updates old order status values to match new pipeline
✅ Shows you the distribution of items across stages
✅ Takes about 5-10 seconds to complete

## Expected Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Migrating Clients (Leads)...
Found 25 clients to update
✅ Updated 25 clients

📦 Migrating Orders...
Found 10 orders with old status values
✅ Updated 10 orders

📋 Checking Projects...
Found 15 projects (status field already compatible)

✓ Checking Tasks...
Found 30 tasks (status field already compatible)

📊 Migration Summary:
-------------------
Clients: 25 updated with pipelineStage
Orders: 10 updated with new status values
Projects: 15 (already compatible)
Tasks: 30 (already compatible)

✅ Migration completed successfully!

📈 Pipeline Stage Distribution:
-------------------

Leads Pipeline:
  prospect: 15
  contacted: 5
  qualified: 3
  won: 2

Orders Pipeline:
  pending: 5
  approved: 3
  processing: 2

Projects Pipeline:
  planning: 8
  in_progress: 5
  completed: 2

Tasks Pipeline:
  todo: 20
  in_progress: 8
  done: 2

🔌 Disconnected from MongoDB
```

## Troubleshooting

### Error: "Cannot find module"
**Solution:** Make sure you're in the backend folder
```bash
cd f:\CODES\CSE327_Project\CRM\backend
```

### Error: "MONGO_URI is not defined"
**Solution:** Check your .env file exists in backend folder

### Error: "Connection failed"
**Solution:** 
- Check your internet connection
- Verify MongoDB connection string in .env
- Make sure MongoDB cluster is accessible

### Migration runs but pipeline still shows zeros
**Solution:**
1. Check you have actual data in database
2. Make sure you're logged in as company admin (not super admin)
3. Check browser console for errors
4. Verify backend is running on port 5000

## After Migration

Your pipeline will now show:
- **Real data** from your MongoDB database
- **Accurate counts** for each stage
- **Working drag-and-drop** functionality
- **Approval workflows** for sensitive transitions

## Safety Note

✅ This migration is **safe** and **idempotent**
- Running it multiple times won't cause issues
- It only updates records that need updating
- No data is deleted
- Original status values are preserved where needed
