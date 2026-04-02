# Master Data Management Feature

## Overview
The Master Data Management feature provides a centralized interface to manage **Document Types** and **Project Categories** that are used throughout the DMS system. This eliminates hardcoded values and allows administrators to dynamically configure these master data items.

## Features

### Document Types Management
- **CRUD Operations**: Create, Read, Update, and Delete document types
- **Fields**:
  - Name (e.g., "Minutes of Meeting")
  - Prefix (e.g., "MoM") - used for file code generation
  - Description (optional)
  - Status (Active/Inactive)
- **Soft Delete**: Deleted items are marked as inactive rather than permanently removed
- **Search**: Filter document types by name or prefix

### Project Categories Management
- **CRUD Operations**: Create, Read, Update, and Delete project categories
- **Fields**:
  - Name (e.g., "Internal")
  - Code (e.g., "INT") - unique identifier
  - Description (optional)
  - Status (Active/Inactive)
- **Soft Delete**: Deleted items are marked as inactive
- **Search**: Filter categories by name or code

## Access

Navigate to: **Configuration → Master Data** tab

Only users with appropriate permissions can access this feature.

## Usage

### Managing Document Types

1. Go to Configuration → Master Data → Document Types tab
2. **To Add**: Click "Add Document Type" button
   - Enter name, prefix, and optional description
   - Click "Create"
3. **To Edit**: Click the action menu (⋮) → Edit
   - Modify fields as needed
   - Click "Update"
4. **To Delete**: Click the action menu (⋮) → Delete
   - Confirm deletion (soft delete - marks as inactive)

### Managing Project Categories

1. Go to Configuration → Master Data → Project Categories tab
2. **To Add**: Click "Add Project Category" button
   - Enter name, code, and optional description
   - Click "Create"
3. **To Edit**: Click the action menu (⋮) → Edit
   - Modify fields as needed
   - Click "Update"
4. **To Delete**: Click the action menu (⋮) → Delete
   - Confirm deletion (soft delete - marks as inactive)

## Integration

These master data items are automatically used in:

- **New Document Request (NDR)** form - dropdown selectors
- **Document Upload** forms
- **Template Management** - document type association
- **Workflow Configuration** - document type-specific workflows
- **All Reports** - filtering and categorization
- **Master Records** - document classification

When you add or update master data, the changes immediately reflect in all dropdowns throughout the system.

## Database Schema

### ProjectCategory Table
```sql
- id (INT, Primary Key)
- name (VARCHAR, Unique)
- code (VARCHAR, Unique)
- description (TEXT, Nullable)
- isActive (BOOLEAN, Default: true)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### DocumentType Table (Enhanced)
```sql
- id (INT, Primary Key)
- name (VARCHAR, Unique)
- prefix (VARCHAR, Unique)
- description (TEXT, Nullable)
- isActive (BOOLEAN, Default: true)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### Document Table Update
- Added: `projectCategoryId` (INT, Foreign Key to ProjectCategory)
- Indexed for performance

## API Endpoints

### Document Types
- `GET /api/system/config/document-types` - List all active document types
- `POST /api/system/config/document-types` - Create new document type
- `PUT /api/system/config/document-types/:id` - Update document type
- `DELETE /api/system/config/document-types/:id` - Delete (soft) document type

### Project Categories
- `GET /api/system/config/project-categories` - List all active project categories
- `POST /api/system/config/project-categories` - Create new project category
- `PUT /api/system/config/project-categories/:id` - Update project category
- `DELETE /api/system/config/project-categories/:id` - Delete (soft) project category

## Default Master Data

### Document Types (Seeded)
1. Minutes of Meeting (MoM)
2. Project Plan (PP)
3. Requirement Analysis (RA)
4. Design Document (DD)
5. Standard Operating Procedure (SOP)
6. Policy Document (POL)
7. User Manual (MAN)
8. Business Case (BC)
9. Work Breakdown Structure (WBS)
10. Risk Management Plan (RMP)

### Project Categories (Seeded)
1. Internal (INT)
2. External (EXT)
3. Client Project (CLIENT)
4. Research & Development (RND)
5. Infrastructure (INFRA)
6. Compliance (COMP)

## Migration

See [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md) for detailed migration steps.

Quick migration:
```bash
# Run the SQL migration (see MIGRATION_INSTRUCTIONS.md)
# Then seed the data:
cd backend
node prisma/seeds/masterData.js
```

## Files Modified/Created

### Backend
- `backend/prisma/schema.prisma` - Added ProjectCategory model
- `backend/src/services/configService.js` - Added CRUD methods
- `backend/src/controllers/configController.js` - NEW - Request handlers
- `backend/src/routes/system.js` - Added master data routes
- `backend/prisma/seeds/masterData.js` - NEW - Seed script

### Frontend
- `frontend/src/components/MasterDataManagement.jsx` - NEW - Main UI component
- `frontend/src/components/Configuration.jsx` - Added Master Data tab
- `frontend/src/components/NewDocumentRequest.jsx` - Fetches from API

### Documentation
- `MASTER_DATA_MANAGEMENT.md` - This file
- `MIGRATION_INSTRUCTIONS.md` - Migration guide

## Best Practices

1. **Before Deleting**: Ensure no documents are using the document type or project category
2. **Naming Convention**: Use clear, descriptive names for both document types and categories
3. **Prefix Codes**: Keep document type prefixes short (2-4 characters) and unique
4. **Category Codes**: Use uppercase codes for consistency
5. **Descriptions**: Add descriptions to help users understand when to use each type/category

## Troubleshooting

### Dropdowns showing "Loading..." indefinitely
- Check backend API is running
- Verify routes are correctly configured in system.js
- Check browser console for errors

### Changes not reflecting in forms
- Hard refresh the page (Ctrl+F5)
- Clear browser cache
- Verify the master data was successfully saved (check API response)

### Migration errors
- See MIGRATION_INSTRUCTIONS.md for detailed troubleshooting
- Verify database connection
- Check for existing migration conflicts

## Future Enhancements

Potential improvements:
- Bulk import/export of master data
- Audit trail for master data changes
- Usage statistics (how many documents use each type/category)
- Archive old types instead of soft delete
- Multi-language support for names
- Custom fields for document types
- Hierarchical categories (parent-child relationships)
