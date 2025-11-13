const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Gallery model (you may need to create this)
const Gallery = require('../models/Gallery');

// GET /api/gallery - Get all gallery images
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery images',
      error: error.message
    });
  }
});

// POST /api/gallery/upload - Upload new gallery image
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, category, section } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    // For now, we'll store as base64 in filePath (in production, use Cloudflare R2)
    const mediaData = req.file.buffer.toString('base64');
    
    const newImage = new Gallery({
      title: title,
      category: category,
      section: section || 'Appliance Services',
      fileName: req.file.originalname,
      filePath: `data:${req.file.mimetype};base64,${mediaData}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
      uploadedBy: req.user?._id || new mongoose.Types.ObjectId(), // Default for now
      isActive: true
    });

    await newImage.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: newImage
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// DELETE /api/gallery/:id - Delete gallery image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedImage = await Gallery.findByIdAndDelete(id);
    
    if (!deletedImage) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

module.exports = router;