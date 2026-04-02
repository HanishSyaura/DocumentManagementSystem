# Dynamic Workflow Configuration System

## Overview
This document describes the implementation of the dynamic workflow configuration system that allows administrators to create, manage, and configure approval workflows for different document types through the UI.

## What Was Implemented

### 1. Backend Services & Controllers

#### New Service: `workflowConfigService.js`
Location: `backend/src/services/workflowConfigService.js`

**Features:**
- `getAllWorkflows()` - Retrieve all configured workflows with steps
- `getWorkflowById(id)` - Get specific workflow configuration
- `createWorkflow(data)` - Create new workflow with multiple steps
- `updateWorkflow(id, data)` - Update existing workflow configuration
- `deleteWorkflow(id)` - Delete workflow (with safety checks)
- `toggleWorkflowStatus(id)` - Activate/deactivate workflows
- `getWorkflowByDocumentType(documentTypeId)` - Get workflow for specific document type

**Key Validations:**
- Only one workflow per document type
- Cannot delete workflow if documents exist for that document type
- All workflow steps must have assigned roles
- Workflow steps are ordered sequentially

#### Updated Controller: `workflowController.js`
Added new endpoints for workflow management:
- `GET /api/workflow/workflows` - List all workflows
- `GET /api/workflow/workflows/:id` - Get specific workflow
- `POST /api/workflow/workflows` - Create new workflow
- `PUT /api/workflow/workflows/:id` - Update workflow
- `DELETE /api/workflow/workflows/:id` - Delete workflow
- `PATCH /api/workflow/workflows/:id/toggle` - Toggle active status

All endpoints are admin-only (require admin role).

### 2. Frontend Components

#### Updated: `WorkflowConfiguration.jsx`
**Changes:**
- Removed mock data, now fetches from real API
- Integrated with `/workflow/workflows` endpoint
- Implemented create, update, delete operations
- Added error handling and user feedback
- Toggle workflow active/inactive status
- Real-time workflow list updates after changes

#### Updated: `AddWorkflowModal.jsx`
**Major Refactoring:**
- Dynamic loading of document types and roles from API
- Removed hardcoded values
- Simplified workflow step structure (removed unused fields)
- Proper API integration for create/update operations
- Document type locking when editing (prevents changing document type)
- Role-based step configuration
- Validation for required fields

**Workflow Step Structure:**
```javascript
{
  id: number,
  stepName: string,
  roleId: number,  // Links to Role table
  timeout: number  // Days before timeout
}
```

### 3. API Routes

#### Added to `backend/src/routes/workflow.js`:
```javascript
router.get('/workflows', authorize('admin'), workflowController.getAllWorkflows);
router.get('/workflows/:id', authorize('admin'), workflowController.getWorkflowByIdController);
router.post('/workflows', authorize('admin'), workflowController.createWorkflow);
router.put('/workflows/:id', authorize('admin'), workflowController.updateWorkflow);
router.delete('/workflows/:id', authorize('admin'), workflowController.deleteWorkflow);
router.patch('/workflows/:id/toggle', authorize('admin'), workflowController.toggleWorkflowStatus);
```

## Database Schema

The system uses existing Prisma schema models:

### Workflow Model
```prisma
model Workflow {
  id              Int      @id @default(autoincrement())
  name            String
  description     String?
  documentTypeId  Int      @unique
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documentType    DocumentType @relation(fields: [documentTypeId], references: [id])
  steps           WorkflowStep[]
}
```

### WorkflowStep Model
```prisma
model WorkflowStep {
  id          Int      @id @default(autoincrement())
  workflowId  Int
  stepOrder   Int
  stepName    String
  roleId      Int
  isRequired  Boolean  @default(true)
  dueInDays   Int?

  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  role        Role     @relation(fields: [roleId], references: [id])

  @@unique([workflowId, stepOrder])
}
```

## Usage Guide

### Creating a Workflow

1. Navigate to Configuration → Workflow Configuration
2. Click "+ Add New Workflow"
3. Fill in basic information:
   - Workflow Name (required)
   - Document Type (required, unique per workflow)
   - Description (optional)
   - Status (Active/Inactive)
4. Configure workflow steps:
   - Click "+ Add Step" to add more steps
   - For each step:
     - Enter step name (e.g., "Review Stage", "Approval Stage")
     - Select role required for this step
     - Set timeout in days (optional)
   - Use up/down arrows to reorder steps
   - Use trash icon to remove steps
5. Review workflow flow visualization
6. Click "Create Workflow"

### Editing a Workflow

1. Find the workflow in the list
2. Click action menu (⋮) → Edit
3. Modify workflow details
4. **Note:** Document type cannot be changed when editing
5. Update steps as needed
6. Click "Update Workflow"

### Deleting a Workflow

1. Find the workflow in the list
2. Click action menu (⋮) → Delete
3. Confirm deletion
4. **Note:** Cannot delete if documents exist for that document type

### Activating/Deactivating Workflows

- Use the toggle switch in the "Active" column
- Inactive workflows won't be used for new documents

## How It Works

### Workflow Configuration Flow
```
Admin creates workflow
    ↓
Selects document type
    ↓
Defines sequential steps
    ↓
Each step assigned to a role
    ↓
Workflow saved to database
    ↓
When document is created with that type
    ↓
System loads workflow configuration
    ↓
Routes document through defined steps
```

### Data Transformation

**Frontend to Backend:**
```javascript
{
  workflowName: "Standard Review",
  documentTypeId: 1,
  description: "Standard approval process",
  status: "Active",
  workflowSteps: [
    {
      stepName: "Review Stage",
      roleId: 2,
      timeout: 3
    },
    {
      stepName: "Approval Stage",
      roleId: 3,
      timeout: 5
    }
  ]
}
```

**Backend Processing:**
- Creates Workflow record
- Creates WorkflowStep records with sequential stepOrder
- Links to DocumentType and Roles
- Returns formatted workflow with all relations

**Backend to Frontend:**
```javascript
{
  id: 1,
  workflowName: "Standard Review",
  documentType: "Proposal",
  documentTypeId: 1,
  description: "Standard approval process",
  steps: 2,
  stepsDetail: ["Review Stage", "Approval Stage"],
  status: "Active",
  workflowSteps: [
    {
      id: 1,
      stepName: "Review Stage",
      stepOrder: 1,
      role: "Reviewer",
      roleId: 2,
      timeout: 3,
      isRequired: true
    },
    {
      id: 2,
      stepName: "Approval Stage",
      stepOrder: 2,
      role: "Approver",
      roleId: 3,
      timeout: 5,
      isRequired: true
    }
  ]
}
```

## Next Steps (Not Yet Implemented)

### Dynamic Workflow Execution
The workflow CONFIGURATION is now complete, but the workflow EXECUTION still uses hardcoded logic. To fully implement dynamic workflows:

1. **Refactor `workflowService.js`** to:
   - Load workflow configuration when document is submitted
   - Use workflow steps instead of hardcoded stages
   - Route tasks based on WorkflowStep.roleId
   - Track current step in document record

2. **Update Document Model** (may need migration):
   ```prisma
   model Document {
     // ... existing fields
     currentWorkflowStepId Int?
     currentWorkflowStep WorkflowStep? @relation(...)
   }
   ```

3. **Implement Generic Workflow Processor**:
   - `processNextStep(documentId)` - Advance to next workflow step
   - `assignTasksByRole(stepId, documentId)` - Assign to users with role
   - `completeStep(documentId, stepId, action)` - Mark step complete

4. **Update Frontend**:
   - Show current workflow step in document view
   - Display workflow progress indicator
   - Allow actions based on current step configuration

## Testing

### Manual Testing Checklist
- [ ] Create workflow with single step
- [ ] Create workflow with multiple steps
- [ ] Edit workflow (add/remove/reorder steps)
- [ ] Delete workflow (should fail if documents exist)
- [ ] Toggle workflow active/inactive status
- [ ] Try to create duplicate workflow for same document type (should fail)
- [ ] Verify document type cannot be changed when editing
- [ ] Test with different roles
- [ ] Verify workflow step ordering is maintained

### API Testing with curl

**Get all workflows:**
```bash
curl -X GET http://localhost:3000/api/workflow/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create workflow:**
```bash
curl -X POST http://localhost:3000/api/workflow/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowName": "Test Workflow",
    "documentTypeId": 1,
    "description": "Test workflow",
    "status": "Active",
    "workflowSteps": [
      {
        "stepName": "Review",
        "roleId": 2,
        "timeout": 3
      }
    ]
  }'
```

## Troubleshooting

### "Failed to load workflows"
- Check backend server is running
- Verify API endpoint is correct: `/workflow/workflows`
- Check authentication token is valid
- Check user has admin role

### "Document type cannot be changed when editing"
- This is by design - document type is locked after workflow creation
- To change document type, delete and recreate the workflow
- Ensure no documents exist for that document type before deleting

### "Cannot delete workflow"
- Workflows cannot be deleted if documents exist for that document type
- Solution: Deactivate the workflow instead of deleting
- Or manually reassign/delete documents first

### Role or Document Type not showing in dropdown
- Verify `/document-types` and `/roles` API endpoints are working
- Check browser console for errors
- Ensure proper data format is returned from API

## Security Considerations

- All workflow management endpoints require admin role
- Workflows can only be modified by admins
- Regular users can only view assigned tasks (not implemented yet)
- Workflow deletion has safety checks to prevent data loss

## Performance Notes

- Workflows are loaded once when configuration page opens
- Step reordering is client-side only (fast)
- Database operations use transactions where needed
- Workflow steps are cascade deleted when workflow is deleted
- Efficient queries with Prisma includes
