# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Enterprise Document Management System (DMS) called "FileNix" - a full-stack web application for managing document lifecycles including drafts, reviews, approvals, and publishing.

**Stack:**
- Backend: Node.js + Express.js + Prisma ORM
- Database: MySQL (via Prisma)
- Frontend: React 18 + Vite + React Router v6 + Tailwind CSS
- Authentication: JWT-based with role-based access control (RBAC)
- File Storage: Local filesystem (./uploads)

## Development Commands

### Starting the Application

**Recommended (Automated):**
```powershell
.\start-dev.ps1
```
Opens two terminal windows - backend on http://localhost:4000, frontend on http://localhost:5173

**Manual Start:**
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Backend Commands

```powershell
cd backend

# Install dependencies
npm install

# Start development server (port 4000)
npm run dev

# Generate Prisma client (required after schema changes)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name <migration_name>
```

### Frontend Commands

```powershell
cd frontend

# Install dependencies
npm install

# Start development server (port 5173, configured in vite.config.js as 3000 but runs on 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Management

Database schema is defined in `backend/prisma/schema.prisma`. After modifying the schema:

1. Generate updated Prisma client: `npx prisma generate`
2. Create and apply migration: `npx prisma migrate dev --name describe_changes`
3. Update backend routes/controllers to use new schema

### Environment Configuration

Backend requires `.env` file in `backend/` directory:
```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/dms_dev"
JWT_SECRET="change_me_in_production"
PORT=4000
UPLOAD_DIR="./uploads"
```

Frontend can optionally use `.env` for API URL:
```env
VITE_API_URL="http://localhost:4000/api"
```

## Architecture

### Backend Structure

```
backend/
├── src/
│   ├── index.js          # Entry point, starts Express server
│   ├── app.js            # Express app setup, middleware, route registration
│   ├── middleware/
│   │   └── auth.js       # JWT authentication middleware (requireAuth)
│   └── routes/
│       ├── auth.js       # POST /api/auth/register, /api/auth/login
│       ├── documents.js  # Document CRUD, versions, requests, drafts, reviews
│       └── reports.js    # GET /api/reports/dashboard (metrics)
├── prisma/
│   └── schema.prisma     # Database schema with User, Document, DocumentVersion, Review, AuditLog
└── uploads/              # File storage directory
```

**Key Patterns:**
- Routes return placeholder/mock data during scaffolding phase - many have `// TODO: persist via Prisma` comments
- File uploads handled by multer middleware, stored in `./uploads/documents/`
- JWT tokens signed with `process.env.JWT_SECRET || 'dev'` fallback
- Auth middleware extracts Bearer token and attaches `req.user` payload

### Frontend Structure

```
frontend/
├── src/
│   ├── main.jsx              # App entry, React Router setup
│   ├── App.jsx               # Route definitions, ProtectedRoute wrapping
│   ├── api/
│   │   └── axios.js          # Axios instance with baseURL and JWT interceptor
│   └── components/
│       ├── Login.jsx         # Authentication page
│       ├── Dashboard.jsx     # Overview with metrics and activity feed
│       ├── NewDocumentRequest.jsx  # Form + list of document requests
│       ├── MyDocumentsStatus.jsx   # User's document status tracking
│       ├── DraftDocuments.jsx      # Draft management interface
│       ├── ReviewAndApproval.jsx   # Review workflow interface
│       ├── Layout.jsx        # Wrapper with Topbar, Sidebar, RightPanel, Footer
│       ├── Topbar.jsx        # Header with logo and user menu
│       ├── Sidebar.jsx       # Navigation menu with active state highlighting
│       ├── RightPanel.jsx    # Notifications and quick access buttons
│       └── ProtectedRoute.jsx # Auth guard checking localStorage token
├── vite.config.js            # Vite config (server port 3000)
└── tailwind.config.cjs       # Tailwind CSS configuration
```

**Key Patterns:**
- All protected pages wrapped in `<ProtectedRoute><Layout><Page /></Layout></ProtectedRoute>`
- API calls use axios instance from `api/axios.js` which auto-attaches JWT from localStorage
- JWT stored in localStorage as 'token'
- Responsive design: 3-column on desktop (≥1024px), 2-column on tablet, single-column on mobile
- Uses inline SVG icons (not @heroicons/react imports)

### Database Schema (Prisma)

**Models:**
- `User` - id, email, password (hashed), name, role (enum: ADMIN/REVIEWER/USER), timestamps
- `Document` - id, title, description, status (enum: DRAFT/PENDING_REVIEW/PUBLISHED/SUPERSEDED/OBSOLETE), createdBy, timestamps
- `DocumentVersion` - id, documentId, version, filePath, fileName, mimeType, size, uploadedBy, uploadedAt, isPublished
- `Review` - id, documentId, reviewerId, comment, decision, createdAt
- `AuditLog` - id, userId, action, meta (JSON), ip, createdAt

**Important:** Most backend routes currently return mock data. Real Prisma integration is marked with `// TODO: persist via Prisma` comments.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (placeholder, not persisting)
- `POST /api/auth/login` - User login (placeholder, always returns token)

### Documents
- `POST /api/documents` - Create document metadata (placeholder)
- `GET /api/documents` - List documents (returns empty array)
- `POST /api/documents/:id/versions` - Upload file version (stores to ./uploads)
- `GET /api/documents/requests` - List document requests (mock data)
- `POST /api/documents/requests` - Create document request (mock response)
- `GET /api/documents/my-status` - Get user's document statuses (mock data)
- `GET /api/documents/drafts` - Get draft documents (mock data)
- `GET /api/documents/review-approval` - Get documents pending review (mock data)

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics and recent activity (mock data)

## Document Approval Workflow (2-Layer System)

**Workflow Structure:**
1. **Reviewer** → Reviews document and assigns **ONE 1st Approver** (mandatory, single selection)
2. **1st Approver** → Approves document and optionally assigns **ONE 2nd Approver** (optional, single selection)
3. **2nd Approver** → Final approval (cannot assign further approvers)

**Important:** Only ONE approver can be assigned at each layer.

**Modal Forms:**
- **ReviewDocumentModal**: Contains "Assign Approver" dropdown (single selection for 1st approver)
- **ApproveDocumentModal**: Contains "Assign Second Approver" dropdown (single selection, only shown to 1st approver)
- **AcknowledgeDocumentModal**: For document acknowledgement after publication (no approver assignment)

## Current Implementation Status

**Completed Pages:**
- ✅ Login (`/login`)
- ✅ Dashboard (`/`)
- ✅ New Document Request (`/new-document-request`)
- ✅ My Documents Status (`/my-documents`)
- ✅ Draft Documents (`/drafts`)
- ✅ Review and Approval (`/review-approval`) with Review/Approve/Acknowledge modals

**Routes exist but need components:**
- Published Documents (`/published`)
- Superseded & Obsolete (`/archived`)
- Configuration (`/config`)
- Logs & Report (`/logs`)
- Master Record (`/master-record`)
- Profile Settings (`/profile`)

**Backend Status:**
- Auth routes are placeholders (always succeed, don't validate DB)
- Most document routes return mock data
- File upload works but doesn't persist metadata to DB
- Prisma schema defined but not integrated into routes

## Development Workflow

### Adding a New Page

1. Create component in `frontend/src/components/PageName.jsx`
2. Import in `frontend/src/App.jsx`
3. Add route wrapped in ProtectedRoute and Layout:
   ```jsx
   <Route path="/new-page" element={
     <ProtectedRoute>
       <Layout>
         <PageName />
       </Layout>
     </ProtectedRoute>
   } />
   ```
4. Update Sidebar.jsx if menu item doesn't exist

### Integrating Backend with Database

When replacing mock data with real Prisma queries:

1. Import Prisma client: `const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();`
2. Replace placeholder response with Prisma query (e.g., `await prisma.document.findMany()`)
3. Add proper error handling with try/catch
4. Consider adding the `requireAuth` middleware if endpoint needs authentication
5. Test with Prisma Studio to verify data changes

### Adding Authentication to Routes

```javascript
const { requireAuth } = require('../middleware/auth');
router.get('/protected-route', requireAuth, (req, res) => {
  // req.user contains JWT payload
  const userId = req.user.id; // or req.user.email depending on token payload
});
```

### File Upload Pattern

```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/:id/versions', upload.single('file'), async (req, res) => {
  // req.file contains uploaded file info
  // Persist metadata with Prisma
});
```

## Code Style and Conventions

### Backend
- Use async/await for asynchronous operations
- Return consistent error format: `res.status(4xx).send({ error: 'message' })`
- Use express.Router() for route modules
- Keep business logic in routes (no separate service layer yet)
- Comments mark TODO items for Prisma integration

### Frontend
- Functional components with hooks
- Use `useState` and `useEffect` for state and side effects
- Implement cleanup in useEffect with `let mounted = true` pattern
- API calls should handle errors and show user feedback
- Use Tailwind utility classes (no custom CSS unless necessary)
- Cards use `.card` class: white bg, shadow, rounded corners

### Database
- Use Prisma's naming conventions: camelCase for fields, PascalCase for models
- Add `@updatedAt` to models that need automatic update timestamps
- Use enums for status fields
- Foreign keys use explicit `@relation` with `fields` and `references`

## Port Assignments

- **Backend:** 4000
- **Frontend:** 5173 (Vite default, configured for 3000 but runs on 5173)
- **MySQL:** 3306
- **Prisma Studio:** 5555 (when running)

## Common Issues and Solutions

### "ERR_CONNECTION_REFUSED"
Backend not running. Start backend server: `cd backend && npm run dev`

### "Failed to load dashboard"
- Check backend is running on port 4000
- Verify `.env` exists in backend directory
- Check browser console for actual error

### Prisma Client Not Found
Run `npx prisma generate` in backend directory after any schema changes

### Database Connection Error
- Ensure MySQL is running
- Verify `DATABASE_URL` in `backend/.env` has correct credentials
- Database name should exist: `CREATE DATABASE dms_dev;`

### Port Already in Use
Check and kill process:
```powershell
# Find process on port
netstat -ano | findstr :4000

# Kill by PID
Stop-Process -Id <PID>
```

## Testing Notes

No automated tests are currently implemented. Manual testing workflow:

1. Start both servers with `.\start-dev.ps1`
2. Open http://localhost:5173
3. Use any credentials to login (auth is placeholder)
4. Navigate through sidebar menu to test pages
5. Submit forms to verify API integration
6. Check browser console for errors
7. Check backend terminal for request logs

## Future Enhancements Needed

- Implement real authentication with password hashing and DB validation
- Replace all mock data with Prisma queries
- Add role-based access control enforcement
- Implement file download endpoints
- Add document versioning logic
- Create audit logging for all actions
- Add input validation and sanitization
- Implement proper error handling middleware
- Add request logging
- Create automated tests
- Add email notifications (SMTP configured per requirements)
