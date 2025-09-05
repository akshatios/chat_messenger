import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { User, Message, Conversation } from '../types';
import { messageAPI } from '../services/api';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const ChatContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--neutral-200) 100%);
  padding: 1rem;
  gap: 1rem;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

interface ChatProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

const Chat: React.FC<ChatProps> = ({ user, onLogout, onUserUpdate }) => {
  const [currentChat, setCurrentChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    // Load conversations
    loadConversations();

    // Set up socket listeners
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat._id);
    }
  }, [currentChat]);

  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (recipientId: string) => {
    try {
      const response = await messageAPI.getMessages(recipientId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleReceiveMessage = (message: Message) => {
    if (currentChat && 
        (message.sender._id === currentChat._id || message.recipient._id === currentChat._id)) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update conversations list
    loadConversations();
  };

  const handleSendMessage = async (content: string) => {
    if (!currentChat) return;

    try {
      console.log('📤 Sending message:', content);
      console.log('👤 Current chat:', currentChat.username, 'ID:', currentChat._id);
      console.log('🙋 Current user:', user.username, 'ID:', user._id);
      
      const messageData = {
        content,
        sender: user._id,
        recipient: currentChat._id
      };

      // Send via socket for real-time
      console.log('⚡ Sending via socket:', messageData);
      socketService.sendMessage(messageData);
      
      // Also send via API for persistence
      console.log('🔄 Sending via API...');
      const response = await messageAPI.sendMessage({
        content,
        recipientId: currentChat._id
      });

      console.log('✅ API response:', response.data);
      const newMessage = response.data.data;
      console.log('➕ Adding message to state:', newMessage);
      setMessages(prev => {
        console.log('📝 Previous messages count:', prev.length);
        return [...prev, newMessage];
      });
      loadConversations();
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!currentChat) return;

    try {
      const response = await messageAPI.sendFile({
        file,
        recipientId: currentChat._id
      });

      const newMessage = response.data.data;
      setMessages(prev => [...prev, newMessage]);
      loadConversations();

      // Also send via socket for real-time notification
      socketService.sendMessage({
        ...newMessage,
        sender: user._id,
        recipient: currentChat._id
      });
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };

  const handleUserOnline = (userId: string) => {
    setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
  };

  const handleUserOffline = (userId: string) => {
    setOnlineUsers(prev => prev.filter(id => id !== userId));
  };

  const handleUserTyping = (data: { sender: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      if (data.isTyping) {
        newMap.set(data.sender, true);
      } else {
        newMap.delete(data.sender);
      }
      return newMap;
    });

    // Clear typing indicator after 3 seconds
    if (data.isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.sender);
          return newMap;
        });
      }, 3000);
    }
  };

  const handleStartTyping = () => {
    if (currentChat) {
      socketService.sendTyping(currentChat._id, true);
    }
  };

  const handleStopTyping = () => {
    if (currentChat) {
      socketService.sendTyping(currentChat._id, false);
    }
  };

  return (
    <ChatContainer>
      <Sidebar
        user={user}
        conversations={conversations}
        currentChat={currentChat}
        onChatSelect={setCurrentChat}
        onLogout={onLogout}
        onlineUsers={onlineUsers}
        onUserUpdate={onUserUpdate}
      />
      <ChatWindow
        user={user}
        currentChat={currentChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
        isTyping={currentChat ? typingUsers.has(currentChat._id) : false}
      />
    </ChatContainer>
  );
};

export default Chat;
