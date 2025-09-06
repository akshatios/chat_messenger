const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple server working!'
  });
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API working!' });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'backend/build')));

// Catch all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/build', 'index.html'));
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on port ${PORT}`);
});
