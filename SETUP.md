# WhatsApp Clone Setup Instructions

## Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - The `.env` file is already created with default values
   - For production, change the `JWT_SECRET` to a secure random string
   - Update `MONGODB_URI` if using a different MongoDB setup

4. Start MongoDB:
   - If using local MongoDB: Make sure MongoDB service is running
   - If using MongoDB Atlas: Update the connection string in `.env`

5. Start the backend server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## Features Implemented

✅ User Authentication (Register/Login)
✅ Real-time messaging with Socket.io
✅ File and image sharing
✅ Online status indicators
✅ Typing indicators
✅ Message delivery status
✅ User search functionality
✅ Conversation list with last message preview
✅ Responsive design
✅ Message timestamps
✅ Unread message count

## Usage

1. **Register a new account** or **login** with existing credentials
2. **Search for users** using the search functionality
3. **Start chatting** by selecting a user from search results
4. **Send messages**, **images**, and **files**
5. **See real-time updates** for online status and typing indicators

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/search?query=...` - Search users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/contacts/:userId` - Add contact
- `DELETE /api/users/contacts/:userId` - Remove contact

### Messages
- `GET /api/messages/:recipientId` - Get messages with user
- `POST /api/messages/send` - Send text message
- `POST /api/messages/send-file` - Send file/image
- `PUT /api/messages/:messageId/read` - Mark message as read
- `GET /api/messages/conversations/list` - Get conversations

## Socket Events

### Client to Server
- `join` - Join with user ID
- `sendMessage` - Send a message
- `typing` - Send typing indicator

### Server to Client
- `receiveMessage` - Receive new message
- `messageSent` - Confirm message sent
- `userOnline` - User came online
- `userOffline` - User went offline
- `userTyping` - User typing indicator

## File Structure

```
whatsapp-clone/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── uploads/          # File uploads directory
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API and Socket services
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Utility functions
│   └── package.json
└── README.md
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 3000 and 5000 are available
2. **MongoDB connection**: Ensure MongoDB is running and accessible
3. **CORS issues**: Check that frontend URL is whitelisted in backend
4. **File uploads**: Ensure the `uploads` directory exists in backend

## Production Deployment

1. Update environment variables for production
2. Build the React app: `npm run build`
3. Serve the built app with a web server
4. Use a production MongoDB instance
5. Use a process manager like PM2 for the backend
6. Set up proper SSL certificates

## Future Enhancements

- Group chat functionality
- Voice messages
- Video calls
- Message reactions
- Push notifications
- Dark mode
- Message encryption
