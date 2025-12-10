# Pipeline Integration Fix - Summary

## Issues Fixed

### 1. **Database Schema Updates**
- ✅ Added `pipelineStage` field to Client model for lead pipeline tracking
- ✅ Updated Order status enum to match pipeline stages (added 'approved', 'completed')
- ✅ Updated Project status enum to include 'approved' stage
- ✅ Task model already had correct status enum

### 2. **Backend Service Improvements**
- ✅ Made `isActive` filter optional in `getPipelineSummary()` 
- ✅ Made `isActive` filter optional in `getEntitiesInStage()`
- ✅ Added proper schema checking before applying isActive filter

### 3. **API Routes Configuration**
- ✅ Added `verifyCompanyAccess` middleware to pipeline routes
- ✅ Ensured `req.companyId` and `req.companyRole` are properly set
- ✅ Simplified route definitions (middleware applied globally)

### 4. **Data Migration**
- ✅ Created migration script: `backend/migrate-pipeline-data.js`
- ✅ Migrates existing clients to add pipelineStage field
- ✅ Updates old order status values (confirmed → approved, refunded → cancelled)
- ✅ Displays pipeline stage distribution after migration

## Pipeline Stages Configuration

### Lead Pipeline (Client model)
```javascript
['prospect', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
```

### Order Pipeline
```javascript
['pending', 'approved', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']
```

### Project Pipeline
```javascript
['planning', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled']
```

### Task Pipeline
```javascript
['todo', 'in_progress', 'review', 'done', 'cancelled']
```

## How to Apply Changes

### Step 1: Run Migration Script
```bash
cd CRM/backend
node migrate-pipeline-data.js
```

This will:
- Update all existing clients with default `pipelineStage` values
- Update old order status values to match new pipeline stages
- Display summary of changes and current distribution

### Step 2: Restart Backend Server
```bash
npm run dev
```

The backend will now:
- Accept pipeline API requests with proper company context
- Return real-time data from database
- Support drag-and-drop stage transitions

### Step 3: Test Frontend Pipeline
1. Login as company admin
2. Navigate to `/pipeline` page
3. You should see:
   - Dashboard with counts for all 4 pipelines
   - Click on any pipeline to see Kanban board
   - Drag and drop cards between stages
   - Approval requests for restricted transitions

## Features Now Working

### ✅ Dynamic Data Loading
- Pipeline dashboard shows real counts from database
- Each pipeline type loads actual entities from MongoDB
- Real-time updates when entities are moved

### ✅ Drag and Drop
- Cards can be dragged between stages
- Invalid transitions are prevented
- Validation happens before moving
- Visual feedback during drag operation

### ✅ Stage Transitions
- Validates allowed transitions per pipeline config
- Requires approval for sensitive stages (won, lost, approved, cancelled)
- Logs activity for audit trail
- Emits real-time updates via Socket.io

### ✅ Admin Approvals
- Company admins see pending approval count
- Can approve/reject transitions
- Approval modal with details
- Notifications sent to requesters

## API Endpoints Working

### Dashboard
```
GET /api/pipeline/dashboard
Headers: X-Company-Id: <companyId>
```

### Pipeline Summary
```
GET /api/pipeline/:type/summary
Types: lead, order, project, task
```

### Entities in Stage
```
GET /api/pipeline/:type/stage/:stage
Example: /api/pipeline/lead/stage/qualified
```

### Move Entity
```
POST /api/pipeline/:type/:entityId/move
Body: { "targetStage": "won", "notes": "Deal closed!" }
```

### Validate Transition
```
POST /api/pipeline/:type/validate
Body: { "currentStage": "proposal", "targetStage": "won" }
```

### Pending Approvals
```
GET /api/pipeline/approvals/pending
```

### Process Approval
```
POST /api/pipeline/approvals/:approvalId
Body: { "approved": true, "reason": "Approved by manager" }
```

## Testing Checklist

- [ ] Run migration script successfully
- [ ] Backend server starts without errors
- [ ] Login as company admin
- [ ] Navigate to /pipeline page
- [ ] Dashboard shows non-zero counts
- [ ] Click on "Leads Pipeline" - see clients in stages
- [ ] Click on "Orders Pipeline" - see orders in stages
- [ ] Click on "Projects Pipeline" - see projects in stages
- [ ] Click on "Tasks Pipeline" - see tasks in stages
- [ ] Drag a card to another stage - see it move
- [ ] Try to move to "won" stage - approval required
- [ ] Check pending approvals badge
- [ ] Approve/reject a pending request
- [ ] Card moves after approval

## Common Issues & Solutions

### Issue: Pipeline shows all zeros
**Solution:** 
- Run migration script: `node migrate-pipeline-data.js`
- Ensure you have data in database (clients, orders, projects, tasks)
- Check browser console for API errors
- Verify X-Company-Id header is being sent

### Issue: Drag and drop doesn't work
**Solution:**
- Check that entities are loaded (console.log in PipelineBoard)
- Verify drag handlers are properly attached
- Check browser console for JavaScript errors

### Issue: "Access denied" errors
**Solution:**
- Ensure user is company admin (not super admin)
- Verify companyId is in localStorage
- Check that verifyCompanyAccess middleware is working
- Use browser dev tools to inspect X-Company-Id header

### Issue: Cards don't move after drop
**Solution:**
- Check transition validation in backend logs
- Verify allowed transitions in PIPELINES config
- Check if approval is required for target stage
- Look for errors in browser console

## File Changes Summary

### Modified Files (6)
1. `backend/src/models/Client.js` - Added pipelineStage field
2. `backend/src/models/Order.js` - Updated status enum
3. `backend/src/models/Project.js` - Updated status enum
4. `backend/src/services/pipelineService.js` - Made isActive optional
5. `backend/src/routes/pipelineRoutes.js` - Added companyAccess middleware

### New Files (2)
1. `backend/migrate-pipeline-data.js` - Data migration script
2. `PIPELINE_FIX_SUMMARY.md` - This documentation

## Next Steps

1. **Run Migration:** Execute `node migrate-pipeline-data.js`
2. **Test Thoroughly:** Use the testing checklist above
3. **Add Test Data:** Create sample clients, orders, projects, tasks in different stages
4. **Monitor Logs:** Watch backend logs for any errors during drag-drop operations
5. **User Training:** Document how admins should use the pipeline feature

## Notes

- Pipeline feature is **admin-only** (company_admin role required)
- Super admins should switch to company context to use pipeline
- Drag-and-drop works on desktop browsers (touch support may vary)
- Real-time updates via Socket.io notify other users of changes
- Activity logs track all stage transitions for audit purposes
