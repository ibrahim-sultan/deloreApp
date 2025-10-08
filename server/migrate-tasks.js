const mongoose = require('mongoose');
const Task = require('./models/Task');
require('dotenv').config();

const migrateTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find tasks without attachment fields
    const tasksWithoutAttachments = await Task.find({
      $or: [
        { attachmentFilename: { $exists: false } },
        { attachmentPath: { $exists: false } },
        { attachmentOriginalName: { $exists: false } }
      ]
    });

    console.log(`Found ${tasksWithoutAttachments.length} tasks without attachment fields`);

    if (tasksWithoutAttachments.length > 0) {
      console.log('These tasks were created before attachment fields were added:');
      tasksWithoutAttachments.forEach(task => {
        console.log(`- ${task.title} (ID: ${task._id})`);
      });
      
      console.log('\nNote: These tasks cannot have attachments downloaded because they were created before the attachment feature was added.');
      console.log('Only newly created tasks (after the attachment feature) will have downloadable attachments.');
    } else {
      console.log('All tasks have attachment fields - no migration needed');
    }

    // Show tasks with attachments
    const tasksWithAttachments = await Task.find({
      attachmentFilename: { $exists: true },
      attachmentPath: { $exists: true }
    });

    console.log(`\nFound ${tasksWithAttachments.length} tasks with attachments:`);
    tasksWithAttachments.forEach(task => {
      console.log(`- ${task.title} (ID: ${task._id})`);
      console.log(`  File: ${task.attachmentFilename}`);
      console.log(`  Path: ${task.attachmentPath}`);
    });

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrateTasks();
