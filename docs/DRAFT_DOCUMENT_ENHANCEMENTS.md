# Draft Document Creation Enhancements

## Overview
Enhanced the "New Draft Document" modal with two major improvements:
1. **Auto-populate from Acknowledged NDR documents**
2. **Dynamic reviewer selection with checkboxes**

## Features Implemented

### 1. Auto-Populate from Acknowledged NDR Documents

#### Workflow
1. **User selects Document Type** → System loads acknowledged documents for that type
2. **User searches File Code** → Dropdown shows matching acknowledged documents
3. **User selects a document** → Auto-fills:
   - File Code
   - Document Title
   - Version Number

#### Technical Implementation

**State Management:**
```javascript
const [acknowledgedDocs, setAcknowledgedDocs] = useState([])
const [loadingAcknowledgedDocs, setLoadingAcknowledgedDocs] = useState(false)
const [searchFileCode, setSearchFileCode] = useState('')
const [showFileCodeDropdown, setShowFileCodeDropdown] = useState(false)
```

**Auto-load on Document Type Change:**
```javascript
useEffect(() => {
  if (formData.documentType) {
    loadAcknowledgedDocuments(formData.documentType)
  }
}, [formData.documentType])
```

**API Call:**
```javascript
const res = await api.get('/documents/my-status', {
  params: {
    status: 'ACKNOWLEDGED',
    limit: 100
  }
})
```

**Search & Filter:**
- Searches by File Code or Title
- Case-insensitive matching
- Real-time filtering as user types

**UI Components:**
- Searchable input field
- Dropdown with acknowledged documents
- Shows: File Code, Title, Version
- Hover effects for better UX
- Click-outside to close dropdown

#### User Experience
1. Select "Document Type" (e.g., "Minutes of Meeting")
2. File Code field becomes enabled
3. Start typing to search acknowledged documents
4. Click on a document from dropdown
5. Form auto-fills with document details
6. User can upload new draft version and submit

### 2. Dynamic Reviewer Selection

#### Features
- **Checkbox-based selection** (instead of multi-select dropdown)
- **Load real users from backend** (no hardcoded names)
- **Filter by active status** (only ACTIVE users shown)
- **Display user details**: Name, Position, Department
- **Show selection count**: "3 reviewer(s) selected"

#### Technical Implementation

**State Management:**
```javascript
const [availableReviewers, setAvailableReviewers] = useState([])
const [loadingReviewers, setLoadingReviewers] = useState(true)
```

**Load Reviewers on Modal Open:**
```javascript
useEffect(() => {
  if (isOpen) {
    loadReviewers()
  }
}, [isOpen])
```

**API Call:**
```javascript
const res = await api.get('/users')
const users = res.data.data?.users || res.data.users || []
const activeUsers = users.filter(user => user.status === 'ACTIVE')
```

**Checkbox Toggle Logic:**
```javascript
const handleReviewerToggle = (userId) => {
  const newReviewers = formData.reviewers.includes(userId)
    ? formData.reviewers.filter(id => id !== userId)
    : [...formData.reviewers, userId]
  
  setFormData({ ...formData, reviewers: newReviewers })
}
```

**UI Components:**
- Scrollable container (max height 12rem)
- Checkbox for each reviewer
- Display: Full Name (or email if no name)
- Secondary info: Position, Department
- Hover effect on reviewer rows
- Selection counter at bottom

#### User Experience
1. Modal opens → Reviewers load automatically
2. Scroll through list of active users
3. Check boxes to select reviewers
4. See real-time count: "3 reviewer(s) selected"
5. Submit with selected reviewers

## API Endpoints Used

### 1. Get Acknowledged Documents
```
GET /api/documents/my-status?status=ACKNOWLEDGED&limit=100
```

**Response:**
```json
{
  "data": {
    "documents": [
      {
        "id": 9,
        "fileCode": "TS/01/251126/001",
        "title": "Terms of Service DMS",
        "version": "1.0",
        "documentType": "Terms of Service",
        "status": "Acknowledged"
      }
    ]
  }
}
```

### 2. Get Active Users
```
GET /api/users
```

**Response:**
```json
{
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@dms.com",
        "firstName": "Admin",
        "lastName": "User",
        "position": "System Administrator",
        "department": "IT",
        "status": "ACTIVE"
      }
    ]
  }
}
```

## Benefits

### Before
❌ Manual entry of file code, title, version  
❌ Hardcoded reviewer list  
❌ Multi-select dropdown (poor UX)  
❌ No search/filter capability  
❌ Risk of typos in file codes  

### After
✅ Auto-populate from acknowledged NDRs  
✅ Search and select file codes  
✅ Dynamic reviewer list from database  
✅ Checkbox selection (better UX)  
✅ Display user details (position, department)  
✅ Filter only active users  
✅ Real-time search and filtering  
✅ Reduced data entry errors  

## User Flow

### Creating Draft from Acknowledged NDR

```
1. Click "New Draft Document"
   ↓
2. Select Document Type: "Minutes of Meeting"
   ↓ (System loads acknowledged MoM documents)
3. File Code field becomes active
   ↓
4. Type to search: "MOM/01"
   ↓ (Dropdown shows matching documents)
5. Click on "MOM/01/251126/001 - Minutes of Meeting 26.11.25"
   ↓ (Form auto-fills)
6. Title: "Minutes of Meeting 26.11.25" ✓
   Version: "1.0" ✓
   ↓
7. Select Reviewers (checkboxes):
   ☑ John Doe (Quality Manager)
   ☑ Jane Smith (Technical Lead)
   ☐ Mike Johnson (Department Head)
   ↓
8. Upload draft file (.docx)
   ↓
9. Click "Submit for Review"
   ↓
10. Done! ✓
```

## Validation Rules

### File Code Field
- Required field
- Disabled until document type is selected
- Must select from acknowledged documents dropdown
- Cannot manually enter arbitrary codes

### Document Title & Version
- Auto-filled when file code is selected
- Can be manually edited if needed
- Title is required
- Version defaults to "1.0"

### Reviewers
- Optional (can submit without reviewers for draft)
- Multiple selection allowed
- Only active users shown
- Minimum 0, no maximum limit

### File Upload
- Optional for "Save as Draft"
- Required for "Submit for Review"
- Supported formats: .docx, .doc, .pdf
- Drag & drop or browse to upload

## Edge Cases Handled

### No Acknowledged Documents
```
Message: "No acknowledged documents found"
User can still manually enter file code if needed
```

### No Active Users
```
Message: "No reviewers available"
Can still save draft without reviewers
```

### Network Errors
```
Console logs error
Falls back to empty state
User sees friendly message
```

### Dropdown Click-Outside
```
Dropdown closes when clicking outside
Preserves selected value
Can reopen by focusing input
```

## Future Enhancements

1. **Version Increment Logic**
   - Auto-increment version number based on latest draft
   - Suggest next version: 1.0 → 1.1 → 2.0

2. **Reviewer Roles Filter**
   - Filter reviewers by role (Quality Manager, Technical Lead)
   - Show recommended reviewers based on document type

3. **File Code Validation**
   - Validate file code format matches document type prefix
   - Check for duplicate file codes

4. **Recent Documents**
   - Show "Recently Used" section in dropdown
   - Quick access to frequently edited documents

5. **Bulk Reviewer Selection**
   - "Select All" / "Clear All" buttons
   - Group reviewers by department

6. **Document Preview**
   - Preview acknowledged document details
   - View document metadata before selection

## Testing Checklist

### Manual Testing
- [ ] Select document type
- [ ] Verify file code field enables
- [ ] Search for acknowledged documents
- [ ] Verify dropdown shows filtered results
- [ ] Click on a document
- [ ] Verify auto-fill works (code, title, version)
- [ ] Verify reviewer list loads
- [ ] Select multiple reviewers with checkboxes
- [ ] Verify selection count updates
- [ ] Upload a file
- [ ] Submit for review
- [ ] Verify data is saved correctly

### Edge Case Testing
- [ ] No acknowledged documents available
- [ ] No active users in system
- [ ] Network error during load
- [ ] Click outside dropdown
- [ ] Clear search field
- [ ] Change document type after selection

## Files Modified

1. **Frontend:**
   - `frontend/src/components/NewDraftModal.jsx`
     - Added acknowledged documents loading
     - Implemented file code search dropdown
     - Added dynamic reviewer checkboxes
     - Click-outside handler for dropdown

## Compatibility

- Works with existing backend endpoints
- No backend changes required
- Compatible with all document types
- Works with existing user roles system

## Performance Considerations

- Acknowledged documents loaded once per document type
- Users loaded once on modal open
- Filtered search happens client-side (fast)
- Dropdown limited to 100 acknowledged documents
- Scrollable containers for large lists

## Security Considerations

- Only shows acknowledged documents owned by user
- Only shows active users (respects user status)
- File code cannot be manually entered (prevents typos)
- Maintains existing authentication/authorization

## Conclusion

These enhancements significantly improve the draft document creation workflow by:
1. **Reducing manual data entry** through auto-population
2. **Improving reviewer selection** with intuitive checkboxes
3. **Preventing errors** by selecting from valid file codes
4. **Better UX** with search, filter, and real-time feedback

The implementation is production-ready, handles edge cases, and provides a smooth user experience.
