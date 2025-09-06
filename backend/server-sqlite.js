const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
// CORS configuration for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, process.env.RAILWAY_STATIC_URL].filter(Boolean)
  : ["http://localhost:3000"];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ["GET", "POST"]
  }
});

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'whatsapp.db',
  logging: false
});

// Define User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Hey there! I am using WhatsApp Clone.'
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define Message model
const Message = sequelize.define('Message', {
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT
  },
  messageType: {
    type: DataTypes.STRING,
    defaultValue: 'text'
  },
  fileUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  fileName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  fileSize: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  },
  deliveredAt: {
    type: DataTypes.DATE
  }
});

// Define associations
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'recipientId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for media files
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp4|mov|avi|webm|mp3|wav|ogg|m4a|aac|zip|rar|xls|xlsx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        [Sequelize.Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 
          'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        isOnline: false,
        lastSeen: new Date()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    await user.update({ isOnline: true, lastSeen: new Date() });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        status: req.user.status,
        isOnline: req.user.isOnline
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Configure profile picture specific multer
const profilePictureUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for profile pictures
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'));
    }
  }
});

// User Routes
app.post('/api/users/profile-picture', authMiddleware, profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Profile picture file is required' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;
    
    // Update user's profile picture
    await req.user.update({ profilePicture: profilePictureUrl });
    
    console.log(`📸 Profile picture updated for user ${req.user.username}: ${profilePictureUrl}`);
    
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePictureUrl,
      user: {
        _id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        profilePicture: profilePictureUrl,
        status: req.user.status,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Server error during profile picture upload' });
  }
});

// Update user status
app.put('/api/users/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || status.trim().length === 0) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    if (status.length > 150) {
      return res.status(400).json({ message: 'Status must be less than 150 characters' });
    }
    
    await req.user.update({ status: status.trim() });
    
    console.log(`📝 Status updated for user ${req.user.username}: ${status.trim()}`);
    
    res.json({
      message: 'Status updated successfully',
      user: {
        _id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        status: status.trim(),
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen
      }
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server error during status update' });
  }
});

// Get user profile by ID
app.get('/api/users/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.findAll({
      where: {
        [Sequelize.Op.and]: [
          { id: { [Sequelize.Op.ne]: req.user.id } },
          {
            [Sequelize.Op.or]: [
              { username: { [Sequelize.Op.like]: `%${query}%` } },
              { email: { [Sequelize.Op.like]: `%${query}%` } }
            ]
          }
        ]
      },
      attributes: { exclude: ['password'] },
      limit: 20
    });

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message Routes
app.get('/api/messages/:recipientId', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [
          { senderId: req.user.id, recipientId: recipientId },
          { senderId: recipientId, recipientId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] },
        { model: User, as: 'Recipient', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // Convert to match frontend format
    const formattedMessages = messages.map(msg => ({
      _id: msg.id,
      sender: { _id: msg.Sender.id, username: msg.Sender.username, profilePicture: msg.Sender.profilePicture },
      recipient: { _id: msg.Recipient.id, username: msg.Recipient.username, profilePicture: msg.Recipient.profilePicture },
      content: msg.content,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      isRead: msg.isRead,
      isDelivered: msg.isDelivered,
      readAt: msg.readAt,
      deliveredAt: msg.deliveredAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    res.json({
      messages: formattedMessages,
      currentPage: page,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId: recipientId,
      content,
      messageType: 'text',
      isDelivered: true,
      deliveredAt: new Date()
    });

    const messageWithUsers = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] },
        { model: User, as: 'Recipient', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] }
      ]
    });

    // Format for frontend
    const formattedMessage = {
      _id: messageWithUsers.id,
      sender: { _id: messageWithUsers.Sender.id, username: messageWithUsers.Sender.username, profilePicture: messageWithUsers.Sender.profilePicture },
      recipient: { _id: messageWithUsers.Recipient.id, username: messageWithUsers.Recipient.username, profilePicture: messageWithUsers.Recipient.profilePicture },
      content: messageWithUsers.content,
      messageType: messageWithUsers.messageType,
      fileUrl: messageWithUsers.fileUrl,
      fileName: messageWithUsers.fileName,
      fileSize: messageWithUsers.fileSize,
      isRead: messageWithUsers.isRead,
      isDelivered: messageWithUsers.isDelivered,
      readAt: messageWithUsers.readAt,
      deliveredAt: messageWithUsers.deliveredAt,
      createdAt: messageWithUsers.createdAt,
      updatedAt: messageWithUsers.updatedAt
    };

    res.status(201).json({
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/messages/send-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }
    
    console.log(`📎 File upload: ${req.file.originalname}, Type: ${messageType}, MIME: ${req.file.mimetype}`);
    
    const message = await Message.create({
      senderId: req.user.id,
      recipientId: recipientId,
      messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      isDelivered: true,
      deliveredAt: new Date()
    });

    const messageWithUsers = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] },
        { model: User, as: 'Recipient', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] }
      ]
    });

    // Format for frontend
    const formattedMessage = {
      _id: messageWithUsers.id,
      sender: { _id: messageWithUsers.Sender.id, username: messageWithUsers.Sender.username, profilePicture: messageWithUsers.Sender.profilePicture },
      recipient: { _id: messageWithUsers.Recipient.id, username: messageWithUsers.Recipient.username, profilePicture: messageWithUsers.Recipient.profilePicture },
      content: messageWithUsers.content,
      messageType: messageWithUsers.messageType,
      fileUrl: messageWithUsers.fileUrl,
      fileName: messageWithUsers.fileName,
      fileSize: messageWithUsers.fileSize,
      isRead: messageWithUsers.isRead,
      isDelivered: messageWithUsers.isDelivered,
      readAt: messageWithUsers.readAt,
      deliveredAt: messageWithUsers.deliveredAt,
      createdAt: messageWithUsers.createdAt,
      updatedAt: messageWithUsers.updatedAt
    };

    res.status(201).json({
      message: 'File sent successfully',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Send file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/conversations/list', authMiddleware, async (req, res) => {
  try {
    // Get all messages involving the current user
    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [
          { senderId: req.user.id },
          { recipientId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] },
        { model: User, as: 'Recipient', attributes: ['id', 'username', 'profilePicture', 'status', 'isOnline', 'lastSeen'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group messages by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const contactId = msg.senderId === req.user.id ? msg.recipientId : msg.senderId;
      const contact = msg.senderId === req.user.id ? msg.Recipient : msg.Sender;
      
      if (!conversationsMap.has(contactId)) {
        conversationsMap.set(contactId, {
          contact: {
            _id: contact.id,
            username: contact.username,
            profilePicture: contact.profilePicture,
            status: contact.status,
            isOnline: contact.isOnline,
            lastSeen: contact.lastSeen
          },
          lastMessage: {
            _id: msg.id,
            sender: { _id: msg.Sender.id, username: msg.Sender.username, profilePicture: msg.Sender.profilePicture },
            recipient: { _id: msg.Recipient.id, username: msg.Recipient.username, profilePicture: msg.Recipient.profilePicture },
            content: msg.content,
            messageType: msg.messageType,
            fileName: msg.fileName,
            createdAt: msg.createdAt
          },
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (msg.recipientId === req.user.id && !msg.isRead) {
        conversationsMap.get(contactId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check messages
app.get('/api/debug/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'Recipient', attributes: ['id', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log('Recent messages:', JSON.stringify(messages, null, 2));
    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Debug messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.broadcast.emit('userOnline', userId);
    console.log(`User ${userId} is now online`);
  });

socket.on('sendMessage', async (messageData) => {
    try {
      console.log('Received message via socket:', JSON.stringify(messageData));
      const recipientSocketId = connectedUsers.get(messageData.recipient);
      if (recipientSocketId) {
        console.log(`Sending message to recipient socket: ${recipientSocketId}`);
        io.to(recipientSocketId).emit('receiveMessage', messageData);
      } else {
        console.log(`Recipient socket not found for ID: ${messageData.recipient}`);
      }
      socket.emit('messageSent', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', error.message);
    }
  });

  socket.on('typing', (data) => {
    const recipientSocketId = connectedUsers.get(data.recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', {
        sender: data.sender,
        isTyping: data.isTyping
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      socket.broadcast.emit('userOffline', socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Catch-all route for React Router in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  console.log('Created uploads directory');
}

// Initialize database and start server
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to SQLite database');
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
    
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Using SQLite database (whatsapp.db)');
    });
  } catch (error) {
    console.error('Unable to connect to database:', error);
  }
};

initializeDatabase();
