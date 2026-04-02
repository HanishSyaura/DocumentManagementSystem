# DMS Home Page Implementation

## Overview
A public-facing landing page has been implemented for the Document Management System (DMS). This page showcases system features and provides a contact form for inquiries before users log in.

## What's Been Implemented

### Backend APIs
1. **Public Routes** (`/api/public/*`)
   - `GET /api/public/features` - Returns system features, user types, and workflow information
   - `POST /api/public/contact` - Handles contact form submissions
   - `GET /api/public/statistics` - Returns public-facing system statistics

2. **Database Changes**
   - Added `Inquiry` model to Prisma schema for storing contact form submissions
   - Fields: name, email, subject, message, organizationType, status, submittedAt

3. **New Files**
   - `backend/src/controllers/publicController.js` - Controller for public endpoints
   - `backend/src/routes/public.js` - Routes for public access

### Frontend Components
1. **HomePage Component** (`frontend/src/components/HomePage.jsx`)
   - Hero section with call-to-action buttons
   - "What is DMS?" section with three key benefits
   - Key Features section (8 features with icons)
   - "Who Uses This System?" section (5 user roles)
   - End-to-End Workflow overview (5 stages)
   - Contact form with organization type selection
   - Responsive navigation bar
   - Footer with system information

2. **Routing Changes**
   - Root path `/` now shows the public HomePage
   - Dashboard moved from `/` to `/dashboard`
   - Login redirects to `/dashboard` after authentication
   - Updated `defaultRoute.js` to reflect new dashboard path

## Features

### Landing Page Sections
1. **Navigation Bar**
   - Sticky header with DMS logo
   - Quick links to Features, Workflow, and Contact sections
   - Login button for authenticated access

2. **Hero Section**
   - Gradient background (blue to cyan)
   - Main heading and description
   - "Get Started" and "Learn More" CTAs

3. **What is DMS?**
   - Three cards highlighting:
     - Centralized Storage
     - Security & Compliance
     - Automated Workflows

4. **Key Features**
   - 8 feature cards with Heroicons
   - Features include: Drafting & Approval, Version Control, Supersession Management, Templates, RBAC, Notifications, Audit Logs, Reports & Analytics

5. **Who Uses This System?**
   - 5 user role cards with color-coded borders:
     - Admin (Blue)
     - Document Controller (Purple)
     - Reviewer (Green)
     - Approver (Yellow)
     - Viewer (Gray)

6. **End-to-End Workflow**
   - Visual workflow with 5 stages
   - Color-coded status indicators
   - Numbered steps with descriptions

7. **Contact Section**
   - Contact information (email, phone)
   - "Why Choose DMS?" highlights
   - Contact form with fields:
     - Name (required)
     - Email (required)
     - Organization Type (dropdown)
     - Subject (optional)
     - Message (required)
   - Form validation and success/error feedback

8. **Footer**
   - DMS branding
   - Copyright and version information

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Get Features
```http
GET /api/public/features
```

**Response:**
```json
{
  "success": true,
  "data": {
    "systemInfo": {
      "title": "Document Management System",
      "description": "...",
      "version": "1.0.0"
    },
    "keyFeatures": [...],
    "userTypes": [...],
    "workflow": [...]
  }
}
```

#### Submit Contact Form
```http
POST /api/public/contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "I would like to know more...",
  "organizationType": "Corporate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inquiryId": 1
  },
  "message": "Thank you for your inquiry. We will get back to you shortly."
}
```

#### Get Statistics
```http
GET /api/public/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "totalUsers": 45,
    "activeWorkflows": 8,
    "documentTypes": 7
  }
}
```

## How to Access

### Development
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to:
   - **Home Page:** http://localhost:5173/
   - **Login:** http://localhost:5173/login
   - **Dashboard:** http://localhost:5173/dashboard (after login)

### Routes
- `/` - Public home page (no authentication)
- `/login` - Login page
- `/dashboard` - Dashboard (authenticated)
- All other routes remain protected and require authentication

## Database Migration

The Inquiry table has been added to the database. To apply the changes:

```bash
cd backend
npx prisma db push
npx prisma generate
```

## Testing the Contact Form

1. Navigate to http://localhost:5173/
2. Scroll to the "Need Assistance?" section
3. Fill out the contact form:
   - Enter your name
   - Enter a valid email
   - Select an organization type
   - (Optional) Add a subject
   - Write a message
4. Click "Send Message"
5. You should see a success message

The inquiry will be saved to the `inquiry` table in the database.

## Customization

### Updating Features
Edit the `getFeatures` function in `backend/src/controllers/publicController.js` to modify:
- System information
- Key features list
- User types
- Workflow stages

### Styling
The HomePage uses Tailwind CSS classes. To customize:
- Colors: Update gradient classes and color schemes
- Layout: Modify grid layouts and spacing
- Typography: Change font sizes and weights in component classes

### Contact Information
Update email addresses and phone numbers in the Contact section of `HomePage.jsx` (lines 327-338).

## Next Steps

1. **Email Notifications:** Integrate SMTP service to send email notifications when contact form is submitted
2. **Admin Panel:** Create an admin interface to view and manage inquiries
3. **Analytics:** Add tracking for landing page visits and conversions
4. **SEO:** Add meta tags and optimize for search engines
5. **Multi-language:** Implement language switcher for English and Mandarin
6. **Content Management:** Create CMS interface to update landing page content without code changes

## Notes

- The landing page is fully responsive and works on mobile, tablet, and desktop
- All icons are from Heroicons v2 (outline)
- The page fetches real data from the backend API
- Contact form has client-side and server-side validation
- The design follows the mockup provided while maintaining consistency with the existing DMS UI

## Troubleshooting

### Backend API not accessible
- Ensure backend server is running on port 4000
- Check VITE_API_URL in `frontend/.env` is set to `http://localhost:4000/api`

### Contact form not submitting
- Check browser console for errors
- Verify backend `/api/public/contact` endpoint is accessible
- Ensure database connection is working

### Styling issues
- Run `npm run dev` in frontend directory
- Clear browser cache
- Check Tailwind CSS is properly configured in `tailwind.config.js`
