const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Get messages between two users
router.get('/:recipientId', auth, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id }
      ]
    })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

    res.json({
      messages: messages.reverse(), // Reverse to get chronological order
      currentPage: page,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a text message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      messageType: 'text',
      isDelivered: true,
      deliveredAt: new Date()
    });

    await message.save();
    
    // Populate sender and recipient info
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a file/image message
router.post('/send-file', auth, upload.single('file'), async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      isDelivered: true,
      deliveredAt: new Date()
    });

    await message.save();
    
    // Populate sender and recipient info
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');

    res.status(201).json({
      message: 'File sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the recipient can mark a message as read
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation list with last message
router.get('/conversations/list', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', req.user._id] },
              then: '$recipient',
              else: '$sender'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'contact'
        }
      },
      {
        $unwind: '$contact'
      },
      {
        $project: {
          contact: {
            _id: 1,
            username: 1,
            avatar: 1,
            isOnline: 1,
            lastSeen: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
