// Minimal Railway-compatible server
console.log('🚀 Starting Railway server from backend directory...');

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('✅ Health check called');
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    message: 'Railway server working!'
  });
});

// API test
app.get('/api/test', (req, res) => {
  console.log('🧪 API test called');
  res.json({ 
    message: 'API working on Railway!', 
    timestamp: new Date().toISOString(),
    path: __dirname
  });
});

// Serve React build files
const buildPath = path.join(__dirname, 'build');
console.log('📁 Build path:', buildPath);

// Check if build directory exists
const fs = require('fs');
if (fs.existsSync(buildPath)) {
  console.log('✅ Build directory found');
  app.use(express.static(buildPath));
  
  // React Router handler
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    console.log('📄 Serving index.html for:', req.path);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.log('❌ index.html not found');
      res.status(404).json({ error: 'Frontend not found' });
    }
  });
} else {
  console.log('❌ Build directory not found');
  app.get('*', (req, res) => {
    res.json({ 
      message: 'Server working, but frontend build not found',
      buildPath: buildPath,
      files: fs.readdirSync(__dirname)
    });
  });
}

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  console.log(`✅ Railway server running on port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🎯 Working directory:`, __dirname);
  console.log(`📂 Files in directory:`, fs.readdirSync(__dirname));
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.message);  
  process.exit(1);
});
