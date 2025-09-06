const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Force production settings
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log('🚀 Starting server in', process.env.NODE_ENV, 'mode');
console.log('🔧 Environment variables check:');
console.log('- PORT:', process.env.PORT || 'NOT SET');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true  // Allow all origins temporarily for debugging
      : ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware - Temporary permissive CORS for debugging
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Allow all origins temporarily for debugging
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Simple request logging for production
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`API: ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoints - MUST be before static files
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  });
});

// API Routes - MUST be before static files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

console.log('✅ API routes registered');

// Serve static files from React build - MUST be after API routes
app.use(express.static('build'));

// Handle React Router (return `index.html` for all non-API routes)
// This should be last to catch all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    
    // Broadcast user online status
    socket.broadcast.emit('userOnline', userId);
    console.log(`User ${userId} is now online`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (messageData) => {
    try {
      // Save message to database
      const Message = require('./models/Message');
      const message = new Message({
        sender: messageData.sender,
        recipient: messageData.recipient,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        fileUrl: messageData.fileUrl || '',
        fileName: messageData.fileName || '',
        fileSize: messageData.fileSize || 0,
        isDelivered: true,
        deliveredAt: new Date()
      });
      
      await message.save();
      await message.populate('sender', 'username avatar');
      await message.populate('recipient', 'username avatar');
      
      console.log('Message saved:', message);
      
      // Emit to specific user if they're online
      const recipientSocketId = connectedUsers.get(messageData.recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', message);
      }
      
      // Confirm message sent
      socket.emit('messageSent', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', error.message);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const recipientSocketId = connectedUsers.get(data.recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', {
        sender: data.sender,
        isTyping: data.isTyping
      });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      // Broadcast user offline status
      socket.broadcast.emit('userOffline', socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// MongoDB connection with multiple fallbacks
const mongoUrls = [
  process.env.MONGODB_URI,
  'mongodb+srv://demo:demo123@cluster0.mongodb.net/whatsapp-clone?retryWrites=true&w=majority',
  'mongodb+srv://test:test123@cluster0.mongodb.net/whatsapp?retryWrites=true&w=majority',
  'mongodb://localhost:27017/whatsapp-clone'
];

async function connectDB() {
  for (const url of mongoUrls) {
    if (!url) continue;
    try {
      console.log('🔗 Attempting MongoDB connection...');
      await mongoose.connect(url);
      console.log('✅ Connected to MongoDB successfully!');
      return;
    } catch (error) {
      console.log('❌ MongoDB connection failed:', error.message);
      continue;
    }
  }
  console.log('💥 All MongoDB connections failed!');
}

connectDB();

const PORT = process.env.PORT || 8000;

// Handle server startup with error handling
server.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🌐 Server ready to accept connections');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
