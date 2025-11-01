const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const DocumentTemplate = require('../models/DocumentTemplate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// Upload document
router.post('/upload', auth, upload.single('document'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, expiryDate } = req.body;

    const document = new Document({
      title,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryDate: new Date(expiryDate),
      uploadedBy: req.user._id
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        expiryDate: document.expiryDate,
        uploadedAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error during document upload' });
  }
});

// List required document templates (for staff view)
router.get('/required/templates', auth, async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({ requiredForAllStaff: true }).sort({ createdAt: 1 }).lean();
    res.json({ templates });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load required templates' });
  }
});

// Required documents status for current user
router.get('/required/status', auth, async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({ requiredForAllStaff: true }).lean();
    const docs = await Document.find({ uploadedBy: req.user._id }).select('title');
    const uploadedTitles = new Set(docs.map(d => (d.title||'').toLowerCase().trim()));
    const status = templates.map(t => ({
      templateId: t._id,
      title: t.title,
      required: true,
      uploaded: uploadedTitles.has((t.title||'').toLowerCase().trim())
    }));
    res.json({ status });
  } catch (e) {
    res.status(500).json({ message: 'Failed to compute required status' });
  }
});

// Get user's documents
router.get('/my-documents', auth, async (req, res) => {
  try {
    console.log('Fetching documents for user:', req.user._id);
    
    const documents = await Document.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('-filePath');
    
    console.log('Found', documents.length, 'documents for user', req.user._id);

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error while fetching documents' });
    }
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
});

// Get document by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document or is admin
    if (document.uploadedBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download document
router.get('/:id/download', auth, async (req, res) => {
  try {
    console.log(`Admin ${req.user.email} attempting to download document ${req.params.id}`);
    
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found');
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('Document found:', {
      id: document._id,
      title: document.title,
      uploadedBy: document.uploadedBy,
      filePath: document.filePath
    });

    // Check if user owns the document or is admin
    if (document.uploadedBy && document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log('Access denied for user');
      return res.status(403).json({ message: 'Access denied' });
    }

    // For admin, always allow download regardless of owner
    if (req.user.role === 'admin') {
      console.log('Admin access granted');
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      console.log('File not found on filesystem:', document.filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    console.log('Sending file for download');
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error during download' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`Admin ${req.user.email} attempting to delete document ${req.params.id}`);
    
    // First find the document without population to avoid issues with missing uploadedBy
    const document = await Document.findById(req.params.id);

    if (!document) {
      console.log('Document not found');
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('Document found:', {
      id: document._id,
      title: document.title,
      uploadedBy: document.uploadedBy,
      filePath: document.filePath
    });

    // Admin can delete any document, staff can only delete their own
    if (req.user.role !== 'admin') {
      // For non-admin users, check ownership
      if (!document.uploadedBy || document.uploadedBy.toString() !== req.user._id.toString()) {
        console.log('Access denied for non-admin user');
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      console.log('Admin access granted for deletion');
    }

    // Delete file from filesystem
    try {
      if (document.filePath && fs.existsSync(document.filePath)) {
        console.log('Deleting file from filesystem:', document.filePath);
        fs.unlinkSync(document.filePath);
      } else {
        console.log('File not found on filesystem, continuing with database deletion');
      }
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      // Continue with document deletion even if file deletion fails
    }

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);
    console.log('Document deleted successfully from database');

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error message based on error type
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error during document deletion' });
    }
    res.status(500).json({ message: 'Server error during document deletion: ' + error.message });
  }
});

module.exports = router;
