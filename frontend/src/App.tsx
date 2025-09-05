import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import { AuthState, User } from './types';
import { authAPI } from './services/api';
import socketService from './services/socket';
import './App.css';

function App() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication (tab-specific)
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (token && storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        console.log('🔄 Restoring session for user:', user.username);
        setAuth({ isAuthenticated: true, user, token });
        
        // Connect to socket
        socketService.connect(user._id);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    } else {
      console.log('🆕 No existing session, redirecting to login');
    }
    
    setLoading(false);
  }, []);

  const login = async (token: string, user: User) => {
    console.log('✅ Logging in user:', user.username);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    setAuth({ isAuthenticated: true, user, token });
    
    // Connect to socket
    socketService.connect(user._id);
  };

  const handleUserUpdate = (updatedUser: User) => {
    console.log('👤 Updating user profile:', updatedUser.username);
    // Update session storage
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    // Update auth state
    setAuth(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setAuth({ isAuthenticated: false, user: null, token: null });
    
    // Disconnect socket
    socketService.disconnect();
    
    // Force redirect to login
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              !auth.isAuthenticated ? 
                <Login onLogin={login} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/register" 
            element={
              !auth.isAuthenticated ? 
                <Register onRegister={login} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/" 
            element={
              auth.isAuthenticated ? 
                <Chat user={auth.user!} onLogout={logout} onUserUpdate={handleUserUpdate} /> : 
                <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
