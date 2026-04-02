# Published Documents - Real-Time Data Setup Guide

## Overview
This guide explains how to set up and use the Published Documents module with real-time data integration.

## Features Implemented

### Backend
1. **Folder Management**
   - Create folders and subfolders
   - Delete folders (only if empty)
   - Hierarchical folder structure
   - Folder-based document organization

2. **Published Documents API**
   - Get all published documents
   - Filter by folder
   - Search documents
   - Pagination support
   - Real-time document metadata (file size, type, dates)

3. **Document Operations**
   - View documents
   - Download documents
   - Delete documents (Admin only)
   - Upload new documents

### Frontend
1. **Folder Tree Sidebar**
   - Hierarchical folder display
   - Click to select folder
   - Expand/collapse subfolders
   - Visual selection indicator
   - Right-click context menu (Admin only)

2. **Document List**
   - Real-time document display
   - Server-side pagination
   - Search functionality
   - Status badges
   - Action menu (View, Download, Delete)

3. **Folder Management UI**
   - Create root folders
   - Create subfolders
   - Delete folders
   - Breadcrumb navigation

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the Folder table:

```bash
cd backend
npx prisma migrate dev
```

If you need to apply manually:
```bash
npx prisma db push
```

### 2. Generate Prisma Client

After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### 3. Seed Initial Folders (Optional)

To create some initial folders for testing:

```bash
node scripts/seed-folders.js
```

This will create:
- Home
- Project Alpha
  - Design Docs
  - Development
  - Testing
- Marketing
- Client Reports
- Archived

### 4. Start the Backend Server

```bash
npm run dev
```

The server should start on http://localhost:3000

### 5. Start the Frontend

In a new terminal:

```bash
cd ../frontend
npm run dev
```

The frontend should start on http://localhost:3001

## Usage

### Creating Folders

1. **Root Folder:**
   - Click "Create New Folder" button
   - Enter folder name
   - Click "Create"

2. **Subfolder:**
   - Click "Create New Sub Folder" button
   - Select parent folder from dropdown
   - Enter subfolder name
   - Click "Create"

### Uploading Documents

1. Click "Upload File" button
2. Fill in document details (file code, title, version, etc.)
3. Select document type
4. Choose files to upload
5. Assign to a folder (if available)
6. Click "Submit"

**Note:** Documents must be published (approved through workflow) to appear in Published Documents.

### Viewing Documents

1. Click on a folder in the sidebar to filter documents
2. Documents in that folder will be displayed
3. Use search bar to find specific documents
4. Click on document name or use "View" action to open

### Downloading Documents

1. Click the three-dot menu on any document
2. Select "Download"
3. File will be downloaded to your browser's download folder

### Deleting Documents (Admin Only)

1. Click the three-dot menu on any document
2. Select "Delete"
3. Confirm the deletion

### Deleting Folders (Admin Only)

**Method 1: Context Menu**
1. Right-click on a folder in the sidebar
2. Select "Delete Folder"
3. Confirm the deletion

**Method 2: Hover Delete Button**
1. Hover over a folder in the sidebar
2. Click the red trash icon that appears
3. Confirm the deletion

**Note:** Folders can only be deleted if they are empty (no documents and no subfolders).

## API Endpoints

### Folders

- `GET /api/folders` - Get all folders with hierarchy
- `POST /api/folders` - Create new folder
  ```json
  {
    "name": "Folder Name",
    "parentId": 1  // optional, for subfolders
  }
  ```
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `GET /api/folders/:id/documents` - Get documents in folder

### Documents

- `GET /api/documents/published` - Get published documents
  - Query params: `folderId`, `page`, `limit`, `search`
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

## Data Flow

### Loading Published Documents

1. Frontend calls `GET /api/documents/published?folderId=X&page=1&limit=15`
2. Backend queries database for published documents in the folder
3. Backend formats document data with version info (file size, type, dates)
4. Returns paginated results to frontend
5. Frontend displays documents in table

### Creating Folders

1. User enters folder name and clicks Create
2. Frontend sends `POST /api/folders` with folder data
3. Backend validates and creates folder in database
4. Backend returns created folder
5. Frontend refreshes folder list
6. New folder appears in sidebar

### Document Upload

1. User fills upload form and selects files
2. Frontend sends multipart/form-data to backend
3. Backend saves file to storage
4. Backend creates document record and version record
5. Document goes through workflow (Review → Approval → Published)
6. Once published, document appears in Published Documents

## Role-Based Access

### Admin
- Create, delete folders
- Upload, delete documents
- Full access to all operations

### Manager / Reviewer / User
- View published documents
- Download documents
- View-only mode for folders (cannot create/delete)

## Troubleshooting

### Folders not loading
- Check backend console for errors
- Verify database migration ran successfully
- Check browser console for API errors

### Documents not appearing
- Ensure documents have `status: 'PUBLISHED'` in database
- Check if documents are assigned to the selected folder
- Verify `folderId` is set correctly in document records

### Upload not working
- Check file size limits
- Verify upload directory permissions
- Check backend logs for errors
- Ensure document goes through approval workflow

### Cannot delete folder
- Folders must be empty (no documents, no subfolders)
- Move or delete contents first
- Check if you have Admin role

## Database Schema

### Folder Table
```sql
CREATE TABLE Folder (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  parentId INT NULL,
  createdById INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (parentId) REFERENCES Folder(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

### Document Table Update
```sql
ALTER TABLE Document ADD COLUMN folderId INT NULL;
ALTER TABLE Document ADD FOREIGN KEY (folderId) REFERENCES Folder(id);
```

## Next Steps

1. **Folder Permissions:** Implement folder-level permissions (who can access which folders)
2. **Folder Move:** Allow moving documents between folders
3. **Folder Search:** Add search functionality for folders
4. **Folder Metadata:** Add description, tags, and other metadata to folders
5. **Bulk Operations:** Upload multiple files, move multiple documents
6. **Document Preview:** Add in-browser document preview (PDF, images)
7. **Version History:** Show document version history in Published Documents
8. **Export:** Export folder contents as ZIP file

## Support

For issues or questions:
1. Check backend console logs
2. Check frontend browser console
3. Review API responses in Network tab
4. Check database records directly

## Testing Checklist

- [ ] Folders load on page load
- [ ] Can create root folder
- [ ] Can create subfolder
- [ ] Can delete empty folder
- [ ] Cannot delete folder with contents
- [ ] Documents display correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Can download document
- [ ] Can delete document (Admin)
- [ ] Folder selection updates document list
- [ ] Breadcrumbs show correct path
- [ ] Admin can see all buttons
- [ ] Non-admin sees view-only mode
