# 💬 WhatsApp Clone

A modern, real-time WhatsApp clone built with React, TypeScript, Node.js, and SQLite. Features include instant messaging, file sharing, user profiles, and comprehensive user status management.

![WhatsApp Clone](https://img.shields.io/badge/WhatsApp-Clone-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

## ✨ Features

- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 💬 **Real-time Messaging** - Instant message delivery with Socket.io
- 📁 **File Sharing** - Support for images, videos, documents, and audio files
- 👤 **User Profiles** - Customizable profiles with status messages and profile pictures
- 🟢 **Online/Offline Status** - Real-time user presence indicators
- ✅ **Message Status** - Delivery and read receipts
- 🔍 **User Search** - Find and connect with other users
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Clean, WhatsApp-inspired interface with Tailwind CSS

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **SQLite** database with Sequelize ORM
- **Socket.io** for real-time messaging
- **JWT** for authentication
- **Multer** for file upload handling
- **bcrypt** for password hashing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
JWT_SECRET=your_super_secret_jwt_key_here
PORT=8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Start the Application

**Backend** (Terminal 1):
```bash
cd backend
npm start
# or
node server-sqlite.js
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

## 📁 Project Structure

```
whatsapp-clone/
├── backend/
│   ├── server-sqlite.js      # Main server file
│   ├── package.json
│   ├── uploads/              # File storage directory
│   └── whatsapp.db          # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/
│   └── package.json
├── README.md
├── SETUP.md                 # Detailed setup instructions
└── .gitignore
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### User Management
- `GET /api/users/search` - Search users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users/profile-picture` - Upload profile picture
- `PUT /api/users/status` - Update user status

### Messaging
- `GET /api/messages/:recipientId` - Get messages with a user
- `POST /api/messages/send` - Send text message
- `POST /api/messages/send-file` - Send file message
- `GET /api/messages/conversations/list` - Get conversations list

## 🔄 Real-time Events

- `join` - User joins the chat
- `sendMessage` - Send a message
- `receiveMessage` - Receive a message
- `typing` - Typing indicator
- `userOnline` - User comes online
- `userOffline` - User goes offline

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Recent Updates

- ✅ Fixed user status visibility in profile modals
- ✅ Enhanced user presence information across all endpoints
- ✅ Improved message delivery with complete user data
- ✅ Added comprehensive error handling
- ✅ Optimized real-time communication

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by WhatsApp's user interface and functionality
- Built with modern web development best practices
- Thanks to the open-source community for the amazing tools and libraries

---

⭐ **If you found this project helpful, please give it a star!** ⭐
