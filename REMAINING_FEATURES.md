# Remaining Features Implementation Guide

## ✅ Completed Features (Deployed)

1. ✅ **Check-in/Check-out functionality** - Staff can clock in/out with automatic hour calculation
2. ✅ **Password change in Profile & Security** - Staff can change password with validation
3. ✅ **Dashboard card navigation** - Cards link to relevant pages (Staff, Tasks with filters)
4. ✅ **Google Maps directions** - Directions button opens Google Maps with location

## 🚧 Remaining Features to Implement

### 1. Fix Edit and Delete Buttons on Admin Task Management

**Current Issue**: Buttons exist but don't have onClick handlers

**Solution**:
```javascript
// In TaskManagement.js, add these functions:

const handleEdit = async (taskId) => {
  // Fetch task details
  const task = allTasks.find(t => t._id === taskId);
  // Open edit modal with pre-filled form
  setEditingTask(task);
  setShowEditModal(true);
};

const handleDelete = async (taskId) => {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await axios.delete(`/api/admin/tasks/${taskId}`);
    fetchData(); // Refresh
    alert('Task deleted successfully');
  } catch (error) {
    alert('Failed to delete task');
  }
};

// Update buttons:
<button className="icon-btn" onClick={() => handleEdit(task._id)}>✏️</button>
<button className="icon-btn danger" onClick={() => handleDelete(task._id)}>🗑️</button>
```

**Backend needed**:
```javascript
// Add to server/routes/admin.js:
router.delete('/tasks/:id', adminAuth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

### 2. Show Clock-in/Clock-out Times to Admin

**Current Issue**: Admin can't see when staff clocked in/out

**Solution**: Update TaskManagement.js table to show clock times
```javascript
// Add columns in table:
<th>Clock In</th>
<th>Clock Out</th>
<th>Hours Worked</th>

// Add data cells:
<td>{task.clockInTime ? formatDateTime(task.clockInTime) : '-'}</td>
<td>{task.clockOutTime ? formatDateTime(task.clockOutTime) : '-'}</td>
<td>{task.hoursSpent ? `${task.hoursSpent.toFixed(2)}h` : '-'}</td>
```

### 3. Fix Timezone to Toronto, Canada (EST/EDT)

**Current Issue**: Using default/Nigeria timezone

**Solution**: Set timezone globally in both frontend and backend

**Backend** (server.js or separate timezone utility):
```javascript
// Add at top of server.js
process.env.TZ = 'America/Toronto';

// Or use moment-timezone for date handling:
const moment = require('moment-timezone');
moment.tz.setDefault('America/Toronto');
```

**Frontend** (use Intl or date-fns with timezone):
```javascript
// Install date-fns-tz: npm install date-fns-tz

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const formatTorontoTime = (date) => {
  const torontoTime = toZonedTime(date, 'America/Toronto');
  return format(torontoTime, 'yyyy-MM-dd HH:mm:ss');
};
```

### 4. Message Reply Functionality for Staff

**Current Issue**: Staff can only read messages, not reply

**Backend**: Add reply endpoint in `server/routes/messages.js`:
```javascript
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { replyText } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add reply to message
    message.replies = message.replies || [];
    message.replies.push({
      text: replyText,
      from: req.user._id,
      sentAt: new Date()
    });
    
    await message.save();
    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

**Frontend**: Update MessagesPage.js to show reply form:
```javascript
const [replyText, setReplyText] = useState('');

const handleReply = async (messageId) => {
  try {
    await axios.post(`/api/messages/${messageId}/reply`, { replyText });
    alert('Reply sent!');
    setReplyText('');
    fetchMessages();
  } catch (error) {
    alert('Failed to send reply');
  }
};

// Add reply form in UI:
<div className="reply-form">
  <textarea 
    value={replyText}
    onChange={(e) => setReplyText(e.target.value)}
    placeholder="Type your reply..."
  />
  <button onClick={() => handleReply(message._id)}>Send Reply</button>
</div>
```

**Update Message Model** (server/models/Message.js):
```javascript
replies: [{
  text: String,
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: { type: Date, default: Date.now }
}]
```

### 5. Document Template Management (Admin Creates Required Documents)

**New Model** (server/models/DocumentTemplate.js):
```javascript
const documentTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  required: { type: Boolean, default: true },
  expiryRequired: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
```

**Backend Routes** (server/routes/documentTemplates.js):
```javascript
// GET /api/document-templates - List all templates
// POST /api/document-templates - Create template (admin only)
// PUT /api/document-templates/:id - Update template
// DELETE /api/document-templates/:id - Delete template
```

**Frontend**: Add DocumentTemplates management page for admin:
- List current required documents
- Add new required document types
- Mark as required/optional
- Set if expiry date is needed

### 6. Required Document Upload for Staff

**Implementation**:
1. Staff dashboard shows list of required documents from templates
2. Each required document shows upload status (Uploaded ✓ / Missing ❌)
3. Staff can upload required documents
4. Staff can also upload additional optional documents
5. Admin can see compliance status (which staff haven't uploaded required docs)

**Frontend** (Staff Documents Page):
```javascript
const [requiredDocs, setRequiredDocs] = useState([]);
const [uploadedDocs, setUploadedDocs] = useState([]);

const fetchRequiredDocuments = async () => {
  const templates = await axios.get('/api/document-templates');
  const uploaded = await axios.get('/api/documents/my-documents');
  
  setRequiredDocs(templates.data);
  setUploadedDocs(uploaded.data);
};

// Show which required docs are missing:
const missingDocs = requiredDocs.filter(req => 
  !uploadedDocs.some(up => up.templateId === req._id)
);
```

## Quick Win Features (Can be done quickly)

### Fix Timezone (Easiest)
1. Add `process.env.TZ = 'America/Toronto'` to server.js
2. Use Intl.DateTimeFormat with timezone in frontend

### Show Clock Times to Admin (Easy)
1. Just add columns to TaskManagement table
2. Data is already being fetched

### Edit/Delete Buttons (Medium)
1. Add onClick handlers
2. Add backend DELETE endpoint
3. Create edit modal (can reuse AssignTaskSimpleForm)

## Complex Features (Need more time)

### Document Templates & Required Uploads
- Requires new database model
- New admin interface for template management
- Staff interface showing required vs uploaded
- Compliance tracking

### Message Replies
- Update Message model to support replies
- Add reply UI for both staff and admin
- Show conversation thread

## Priority Recommendation

**High Priority** (Do first):
1. Fix timezone to Toronto
2. Show clock-in/out times to admin
3. Fix edit/delete buttons

**Medium Priority**:
4. Message reply functionality

**Lower Priority** (Nice to have):
5. Document template system
6. Required document tracking

## Testing Checklist

After implementing each feature:
- [ ] Test on local development
- [ ] Check console for errors
- [ ] Test with real data
- [ ] Verify database updates
- [ ] Test on mobile view
- [ ] Push to GitHub
- [ ] Verify Render deployment
- [ ] Test on production URL
