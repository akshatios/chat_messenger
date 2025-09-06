// Railway-specific minimal server
console.log('🚀 Starting Railway server...');

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));

// Health check - most important
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production'
  });
});

// API test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API working on Railway!', timestamp: new Date().toISOString() });
});

// Serve React build files
const buildPath = path.join(__dirname, 'backend', 'build');
console.log('📁 Serving static files from:', buildPath);

app.use(express.static(buildPath));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  console.log('📄 Serving index.html for:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(500).send('Server Error');
    }
  });
});

// Start server with detailed logging
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  console.log(`✅ Railway server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 App: http://localhost:${PORT}`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});
