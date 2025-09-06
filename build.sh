#!/bin/bash

echo "🔧 Building WhatsApp Clone for Railway..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install --prefix frontend

# Build frontend
echo "🏗️ Building React frontend..."
npm run build --prefix frontend

# Copy build to backend
echo "📁 Copying build files..."
cp -r frontend/build backend/ || true

# Install backend dependencies  
echo "📦 Installing backend dependencies..."
npm install --prefix backend

echo "✅ Build complete!"
