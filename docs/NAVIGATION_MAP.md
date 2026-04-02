# DMS Navigation Map

## 🗺️ Implemented Routes

| Page | URL | Component | Status |
|------|-----|-----------|--------|
| **Dashboard** | `/` | `Dashboard.jsx` | ✅ Complete |
| **New Document Request** | `/new-document-request` | `NewDocumentRequest.jsx` | ✅ Complete |
| Login | `/login` | `Login.jsx` | ✅ Complete |

## 📋 Pending Routes (In Sidebar)

| Page | URL | Status |
|------|-----|--------|
| My Documents Status | `/my-documents` | 🔜 TODO |
| Draft Documents | `/drafts` | 🔜 TODO |
| Review and Approval | `/review` | 🔜 TODO |
| Published Documents | `/published` | 🔜 TODO |
| Superseded & Obsolete | `/archived` | 🔜 TODO |
| Configuration | `/config` | 🔜 TODO |
| Logs & Report | `/logs` | 🔜 TODO |
| Master Record | `/master-record` | 🔜 TODO |
| Profile Settings | `/profile` | 🔜 TODO |

## 🚀 Quick Access (Right Panel)

All 4 buttons now navigate correctly:
- ✅ New Document Request → `/new-document-request`
- 🔜 Draft Documents → `/drafts` (route exists, page TODO)
- 🔜 Pending for Review → `/review` (route exists, page TODO)
- 🔜 Published Documents → `/published` (route exists, page TODO)

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Sidebar: Always visible (left)
- Main content: Center
- Right panel: Always visible (notifications + quick access)

### Tablet (768px - 1023px)
- Sidebar: Always visible (left, narrower)
- Main content: Center (more space)
- Right panel: Hidden

### Mobile (<768px)
- Sidebar: Hidden, opens via hamburger menu
- Main content: Full width
- Right panel: Hidden
- Mobile notifications shown in Dashboard

## 🎨 UI Components

### Shared Components
- `Layout.jsx` - Main wrapper with topbar, sidebar, right panel, footer
- `Sidebar.jsx` - Left navigation with active state
- `Topbar.jsx` - Top bar with logo and user menu
- `RightPanel.jsx` - Notifications and quick access
- `ProtectedRoute.jsx` - Authentication guard

### Page Components
- `Dashboard.jsx` - Overview with metrics and activity
- `NewDocumentRequest.jsx` - NDR form and request list
- `Login.jsx` - Authentication page

## 🔗 Navigation Methods

### 1. Sidebar Menu
Click any menu item to navigate. Active page is highlighted with blue background.

### 2. Quick Access (Right Panel)
4 button shortcuts for common actions.

### 3. Topbar Logo
"FileNix" logo navigates to Dashboard.

### 4. Footer Links
- Terms of Use
- Privacy Policy  
- System Access

### 5. In-Page Links
- Dashboard: "View All Logs" → Future logs page
- NDR: Document titles → Future document detail pages

## 🎯 User Journey Examples

### Submit New Document
1. Click "New Document Request" in sidebar OR Quick Access
2. Fill form fields
3. Click "Send Request"
4. View in request list below

### Check Dashboard
1. Click "Dashboard" in sidebar OR FileNix logo
2. View metrics (drafts, pending, published, obsolete)
3. See recent activity table
4. Read notifications in right panel

### Navigate to Other Pages
1. Click menu item in sidebar
2. Currently shows placeholder (TODO)
3. Need to create component for each route

## 🛠️ For Developers

### Add New Page
1. Create component in `frontend/src/components/PageName.jsx`
2. Import in `App.jsx`
3. Add route:
   ```jsx
   <Route path="/page-url" element={
     <ProtectedRoute>
       <Layout>
         <PageName />
       </Layout>
     </ProtectedRoute>
   } />
   ```
4. Menu item already exists in sidebar!

### Update Backend
1. Add API route in `backend/src/routes/`
2. Register in `backend/src/app.js`
3. Update frontend API calls

### Test Navigation
```javascript
// In browser console
window.location.pathname  // Check current route
history.back()           // Go back
history.forward()        // Go forward
```

## 📊 Current Progress

**Pages:** 3/12 complete (25%)
- ✅ Dashboard
- ✅ New Document Request  
- ✅ Login
- 🔜 9 pages remaining

**API Endpoints:**
- ✅ `/api/auth/*` - Authentication
- ✅ `/api/reports/dashboard` - Dashboard metrics
- ✅ `/api/documents/requests` - NDR CRUD
- ✅ `/api/documents/*` - Document management placeholders
- 🔜 More endpoints needed for remaining pages

## 🎨 Design System

All pages follow:
- **Layout:** Topbar + Sidebar + Main + (Right Panel)
- **Cards:** White background, subtle shadow, rounded corners
- **Primary Color:** Blue (#0f6fcf)
- **Typography:** Inter font family
- **Spacing:** Consistent padding/margins
- **Responsive:** Mobile-first approach
