# My Document Status Module

## Overview
The **My Document Status** module provides comprehensive document tracking across all workflow stages in the DMS. This module allows document owners and stakeholders to monitor document progress from initial New Document Request (NDR) through to Archive.

## Features

### 1. Comprehensive Status Tracking
Tracks documents through all workflow stages:
- **NDR (New Document Request)**: Pending Acknowledgment, Acknowledged
- **Draft**: Document creation and editing
- **Review**: Waiting for Review, In Review, Return for Amendments
- **Approval**: Waiting for Approval, In Approval
- **Published**: Approved and Published documents
- **Archived**: Superseded, Obsolete, Archived documents

### 2. Visual Progress Tracker
- Horizontal progress bar (desktop) showing current workflow stage
- Vertical progress bar (mobile) for better mobile experience
- 6-stage workflow visualization: NDR → Draft → Review → Approval → Published → Archived

### 3. Status Summary Dashboard
Quick overview cards showing document counts by status:
- Pending Acknowledgment
- Draft
- In Review
- In Approval
- Published
- Archived

Users can click on any summary card to filter documents by that status.

### 4. Document Details Panel
Slide-out panel displaying:
- Complete document information (file code, title, version, type, etc.)
- Document owner and creator
- Full workflow history timeline with:
  - Stage names
  - Completion dates
  - Users who performed actions
  - Visual indicators (completed/pending)

### 5. Advanced Search and Filtering
- **Search**: By file code or document title
- **Status Filter**: Dropdown with all available statuses
- **Quick Filters**: Via status summary cards
- Real-time filtering with instant results

### 6. Pagination
- Configurable rows per page (10, 15, 25, 50, 100)
- Page navigation
- Total records display
- Smooth scrolling on page change

### 7. Responsive Design
- Desktop: Full table view with action buttons
- Mobile: Card-based layout
- Touch-friendly interface
- Optimized for all screen sizes

## API Endpoints

### GET /api/documents/my-status
Retrieves all documents for the authenticated user with comprehensive tracking information.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 100)
- `status` (optional): Filter by document status (e.g., DRAFT, PUBLISHED)
- `stage` (optional): Filter by workflow stage (e.g., REVIEW, APPROVAL)

**Response Fields:**
```javascript
{
  "documents": [
    {
      "id": 1,
      "fileCode": "DOC-2025-001",
      "title": "Document Title",
      "documentType": "General Document",
      "projectCategory": "Internal",
      "version": "1.0",
      "lastUpdated": "26/11/2024",
      "status": "Draft",                    // Friendly status name
      "rawStatus": "DRAFT",                 // Database status
      "stage": "DRAFT",                     // Current workflow stage
      "createdAt": "20/11/2024",
      "submittedAt": null,
      "reviewedAt": null,
      "approvedAt": null,
      "acknowledgedAt": null,
      "publishedAt": null,
      "obsoleteDate": null,
      "owner": "John Doe",
      "createdBy": "John Doe",
      "hasFile": true,
      "fileName": "document.pdf",
      "description": "Document description",
      "obsoleteReason": null,
      "supersededById": null
    }
  ]
}
```

## Database Schema Integration

The module tracks the following Document model fields:
- `status`: Current document status (enum)
- `stage`: Current workflow stage (enum)
- `submittedAt`: When document was submitted
- `reviewedAt`: When document was reviewed
- `approvedAt`: When document was approved
- `acknowledgedAt`: When NDR was acknowledged
- `publishedAt`: When document was published
- `obsoleteDate`: When document became obsolete
- `supersededById`: ID of superseding document

## Status Mapping

### Backend Status → Frontend Display
The system maps database statuses to user-friendly labels:

| Database Status | Display Status |
|----------------|----------------|
| PENDING_ACKNOWLEDGMENT | Pending Acknowledgment |
| ACKNOWLEDGED | Acknowledged |
| DRAFT | Draft |
| PENDING_REVIEW | Waiting for Review |
| IN_REVIEW | In Review |
| RETURNED | Return for Amendments |
| PENDING_APPROVAL | Waiting for Approval |
| IN_APPROVAL | In Approval |
| APPROVED | Approved |
| REJECTED | Rejected |
| PUBLISHED | Published |
| SUPERSEDED | Superseded |
| OBSOLETE | Obsolete |
| ARCHIVED | Archived |

### Status → Workflow Stage Mapping
| Status | Workflow Stage |
|--------|---------------|
| Pending Acknowledgment | NDR |
| Acknowledged | Draft |
| Draft | Draft |
| Waiting for Review | Review |
| In Review | Review |
| Return for Amendments | Review |
| Waiting for Approval | Approval |
| In Approval | Approval |
| Approved | Published |
| Published | Published |
| Superseded/Obsolete/Archived | Archived |

## Usage

### For Document Owners
1. Navigate to "My Documents Status" from the sidebar
2. View all your documents with their current status
3. Use status summary cards for quick filtering
4. Click on any document to:
   - Update the progress tracker
   - View detailed workflow history
5. Search or filter to find specific documents
6. Click "View Details" to see complete document information

### For Administrators
- Can view all documents in the system (when implemented with admin filters)
- Monitor workflow bottlenecks
- Track document lifecycle across the organization

## Implementation Details

### Frontend Components
- **MyDocumentsStatus.jsx**: Main component
- **ProgressTracker**: Workflow stage visualization
- **DocumentDetailsPanel**: Slide-out details panel
- **StatusBadge**: Status display component
- **EmptyState**: No data state
- **Pagination**: Pagination controls

### Backend Controllers
- **documentController.js**:
  - `getMyDocuments()`: Main endpoint handler
  - `formatDocumentStatus()`: Status formatting helper

### Integration Points
- Integrates with all document workflow modules:
  - New Document Request (NDR)
  - Draft Documents
  - Review & Approval
  - Published Documents
  - Superseded/Obsolete

## Best Practices

1. **Regular Updates**: Document status should be updated at each workflow stage
2. **Timestamp Tracking**: Always record timestamps when status changes
3. **User Attribution**: Record which user performed each action
4. **Comments**: Add workflow comments for audit trail
5. **File Versioning**: Maintain version history alongside status changes

## Future Enhancements

Potential improvements:
1. Export to Excel/PDF
2. Advanced analytics and reporting
3. Email notifications on status changes
4. Bulk status updates
5. Custom workflow configurations
6. Document comparison between versions
7. Real-time collaboration features
8. Mobile app integration
9. Document retention policy automation
10. AI-powered document classification

## Troubleshooting

### Documents Not Showing
- Check user permissions
- Verify document ownership (ownerId matches user)
- Check database connection
- Verify API authentication

### Status Not Updating
- Ensure workflow transitions are properly implemented
- Check timestamp fields are being set
- Verify database triggers/hooks

### Performance Issues
- Implement pagination with appropriate page sizes
- Add database indexes on frequently queried fields
- Use caching for static data
- Optimize database queries with proper joins

## Testing

Run the test script:
```bash
node test-my-document-status.js
```

The test covers:
- Login authentication
- Document retrieval
- Status filtering
- Stage filtering
- Data structure validation
- Status breakdown statistics

## Security Considerations

- All endpoints require authentication
- Users can only see their own documents (by default)
- RBAC controls access to admin features
- Sensitive fields are sanitized before display
- SQL injection prevention via Prisma ORM
- XSS protection in frontend rendering

## Performance Metrics

Target performance:
- Page load: < 2 seconds
- Search/filter: < 500ms
- API response: < 1 second for 100 documents
- Details panel: < 100ms to open

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- ARIA labels on interactive elements
- High contrast mode support
- Focus indicators
- Responsive text sizing
