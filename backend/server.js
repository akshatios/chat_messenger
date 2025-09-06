const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://chatmessenger-production.up.railway.app"] 
      : ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? "https://chatmessenger-production.up.railway.app"
    : "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'WhatsApp Clone API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
