# Multi-stage build for WhatsApp Clone
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

# Install Python and build dependencies for SQLite
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "server-sqlite.js"]
