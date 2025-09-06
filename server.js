// ROOT LEVEL SERVER FOR RAILWAY (GUARANTEED PATH - NO MONGODB)
console.log('🚀 Starting ROOT server for Railway WITHOUT MongoDB...');

const express = require('express');
const path = require('path');
const fs = require('fs');

// In-memory user storage (temporary)
const users = new Map();
const sessions = new Map();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check called');
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    message: 'ROOT Railway server working!',
    directory: __dirname,
    files: fs.readdirSync(__dirname).slice(0, 10) // Show first 10 files
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 API test called');
  res.json({ 
    message: 'API working from ROOT server!', 
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// Simple registration endpoint (temporary)
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registration attempt:', req.body);
  res.json({
    success: true,
    message: 'Registration working (temporary)',
    user: { username: req.body.username, email: req.body.email },
    token: 'temp-token-123'
  });
});

// Simple login endpoint (temporary)
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  res.json({
    success: true,
    message: 'Login working (temporary)',
    user: { username: 'testuser', email: req.body.email },
    token: 'temp-token-123'
  });
});

// Try to serve React build from multiple possible locations
const possibleBuildPaths = [
  path.join(__dirname, 'backend', 'build'),
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'dist')
];

let activeBuildPath = null;

for (const buildPath of possibleBuildPaths) {
  if (fs.existsSync(buildPath)) {
    console.log('✅ Found build directory:', buildPath);
    activeBuildPath = buildPath;
    break;
  }
}

if (activeBuildPath) {
  // Serve static files
  app.use(express.static(activeBuildPath));
  
  // React Router catch-all
  app.get('*', (req, res) => {
    const indexPath = path.join(activeBuildPath, 'index.html');
    console.log('📄 Serving index.html for:', req.path);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ 
        error: 'Frontend index.html not found',
        indexPath: indexPath
      });
    }
  });
} else {
  console.log('❌ No build directory found');
  app.get('*', (req, res) => {
    res.json({ 
      message: 'Server working! Build directory not found.',
      searchedPaths: possibleBuildPaths,
      availableFiles: fs.readdirSync(__dirname)
    });
  });
}

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  
  console.log(`✅ ROOT Railway server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Working directory: ${__dirname}`);
  console.log(`📁 Process CWD: ${process.cwd()}`);
  console.log(`📁 Build path: ${activeBuildPath || 'NOT FOUND'}`);
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});
