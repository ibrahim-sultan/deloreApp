# Email Notifications for Task Assignments

## Overview
The Delore app now sends email notifications to staff members when tasks are assigned to them by an admin. This feature uses Postmark as the email service provider.

## Features Implemented

### 1. Email Notifications on Task Assignment
When an admin assigns a task to a staff member, the staff automatically receives an email notification containing:
- Task title
- Task description
- Location address
- GPS coordinates (if available)
- Client name
- Contact person
- Scheduled start and end times
- Total hours
- Geofence requirement (500m radius for clock-in)

### 2. Email Notifications on Task Reassignment
When an admin updates a task and changes the assigned staff member, the newly assigned staff receives an email notification.

### 3. Notification Tracking
Tasks have a `notificationSent` field that tracks whether an email notification was successfully sent.

## Implementation Details

### Endpoints That Send Emails

#### 1. `/api/admin/assign-task` (POST)
- **Purpose**: Admin creates and assigns a new task to a staff member
- **Email Trigger**: Automatically sends email when task is created with assignment
- **Location**: `server/routes/admin.js` (lines 376-401)

#### 2. `/api/admin/tasks/:id` (PUT)
- **Purpose**: Admin updates an existing task
- **Email Trigger**: Sends email when `assignedTo` field is changed to a new staff member
- **Location**: `server/routes/admin.js` (lines 591-629)

#### 3. `/api/tasks/create` (POST)
- **Purpose**: Staff or admin creates a task
- **Email Trigger**: Sends email if task includes `assignedTo` field
- **Location**: `server/routes/tasks.js` (lines 121-139)

#### 4. `/api/tasks/:id` (PUT)
- **Purpose**: Staff updates their own task
- **Email Trigger**: Sends email if `assignedTo` is newly set or changed
- **Location**: `server/routes/tasks.js` (lines 299-318)

### Email Service
- **Service**: Postmark
- **Utility Module**: `server/utils/mailer.js`
- **Package**: `postmark` (v4.0.4)

### Environment Variables Required

The following environment variables must be set in your Render environment (or `.env` file for local development):

```env
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your_postmark_server_token_here
MAIL_FROM=noreply@yourdomain.com
# OR
EMAIL_FROM=noreply@yourdomain.com

# Optional: Postmark Message Stream (defaults to 'outbound')
POSTMARK_STREAM=outbound
```

## Email Template

The email sent to staff includes:

```html
<h2>You have been assigned a new task</h2>
<p><strong>Title:</strong> [Task Title]</p>
<p><strong>Description:</strong> [Task Description]</p>
<p><strong>Location:</strong> [Address]</p>
<p><strong>Coordinates:</strong> [Latitude], [Longitude]</p>
<p><strong>Client:</strong> [Client Name]</p>
<p><strong>Contact Person:</strong> [Contact Name]</p>
<p><strong>Start Time:</strong> [Scheduled Start Time]</p>
<p><strong>End Time:</strong> [Scheduled End Time]</p>
<p><strong>IMPORTANT:</strong> You must be within 500 meters of the assigned location to check in.</p>
<p>Please log in to your portal to view more details and clock in when you arrive at the location.</p>
```

## Testing

### Local Testing (If Environment Variables Are Set)

Run the test script to verify email configuration:

```bash
node test-email.js staff@example.com
```

This will:
1. Check if environment variables are set
2. Send a test email to the specified address
3. Report success or failure

### Production Testing on Render

Since your Postmark credentials are already configured in Render:

1. **Deploy the changes** to Render
2. **Log in as admin** to the Delore app
3. **Assign a task** to a staff member via the admin dashboard
4. **Check the staff member's email** inbox for the notification
5. **Check Render logs** to verify email was sent:
   ```
   Email notification sent to staff@example.com for task [task_id]
   ```

### Troubleshooting

If emails are not being sent:

1. **Check Render environment variables:**
   - Go to Render Dashboard → Your Service → Environment
   - Verify `POSTMARK_SERVER_TOKEN` is set
   - Verify `MAIL_FROM` or `EMAIL_FROM` is set

2. **Check Render logs:**
   ```bash
   # Look for email-related messages
   Email notification sent to...
   Email notification failed:...
   Postmark client not available...
   ```

3. **Verify Postmark account:**
   - Log in to your Postmark account
   - Check if sender email is verified
   - Check if server token is valid and active
   - Review Activity feed for sent/failed emails

4. **Test email sending:**
   - The app continues to work even if emails fail
   - Check console logs for error messages
   - Email failures are logged but don't break the assignment process

## Error Handling

Email sending is wrapped in try-catch blocks to ensure:
- Task assignment succeeds even if email fails
- Errors are logged to console for debugging
- Users receive appropriate feedback

Example log output:
```
✓ Email notification sent to john@example.com for task 507f1f77bcf86cd799439011
✗ Email notification failed: Invalid API token
```

## Code Modifications Made

### 1. Enhanced `admin.js` - Task Update Endpoint
- **File**: `server/routes/admin.js`
- **Lines**: 570-639
- **Changes**: Added email notification logic when task assignment changes

## Future Enhancements

Potential improvements:
1. **Email templates**: Use Postmark templates for consistent branding
2. **Notification preferences**: Allow staff to customize notification settings
3. **Reminder emails**: Send reminders before scheduled start time
4. **Completion notifications**: Notify admin when tasks are completed
5. **Daily digest**: Send daily summary of assigned tasks
6. **SMS notifications**: Add SMS option for urgent tasks

## Related Files

- `server/routes/admin.js` - Admin task assignment routes
- `server/routes/tasks.js` - Staff task management routes
- `server/utils/mailer.js` - Email service utility
- `server/models/Task.js` - Task model with notification tracking
- `server/models/User.js` - User model with email field
- `test-email.js` - Email testing script

## Support

For issues with email notifications:
1. Check this documentation
2. Review Render logs
3. Verify Postmark configuration
4. Test with the provided test script
