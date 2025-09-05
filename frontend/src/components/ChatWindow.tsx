import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { User, Message } from '../types';
import UserProfileModal from './UserProfileModal';

const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
`;

const ChatHeader = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: translateX(-100%);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const Avatar = styled.div<{ $isOnline?: boolean; $profilePicture?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => 
    props.$profilePicture 
      ? `url(http://localhost:8000${props.$profilePicture}) center/cover` 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-md) ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$isOnline ? '#4caf50' : '#9e9e9e'};
    border: 2px solid white;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  font-weight: bold;
  color: #333;
`;

const ContactStatus = styled.div`
  color: #666;
  font-size: 0.875rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: 
    radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.02) 0%, transparent 50%);
  position: relative;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  /* Message entrance animation */
  & > div {
    animation: messageSlideIn 0.3s ease-out;
  }
  
  @keyframes messageSlideIn {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled.div<{ $isOwn: boolean }>`
  max-width: 70%;
  padding: 1rem 1.25rem;
  border-radius: ${props => props.$isOwn ? '20px 20px 6px 20px' : '20px 20px 20px 6px'};
  word-wrap: break-word;
  align-self: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isOwn 
    ? 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)' 
    : 'rgba(255, 255, 255, 0.95)'
  };
  color: ${props => props.$isOwn ? 'white' : 'var(--text-primary)'};
  box-shadow: ${props => props.$isOwn 
    ? 'var(--shadow-md), 0 0 20px rgba(102, 126, 234, 0.3)' 
    : 'var(--shadow-sm)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isOwn 
    ? 'rgba(255, 255, 255, 0.2)' 
    : 'rgba(255, 255, 255, 0.3)'
  };
  position: relative;
  transition: all var(--transition-md) ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.$isOwn 
      ? 'var(--shadow-lg), 0 0 30px rgba(102, 126, 234, 0.4)' 
      : 'var(--shadow-md)'
    };
  }
  
  /* Subtle glow effect for own messages */
  ${props => props.$isOwn && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
      border-radius: inherit;
      z-index: -1;
      opacity: 0;
      transition: opacity var(--transition-md);
    }
    
    &:hover::before {
      opacity: 1;
    }
  `}
`;

const MessageContent = styled.div`
  margin-bottom: 0.25rem;
`;

const MessageImage = styled.img`
  max-width: 300px;
  max-height: 300px;
  border-radius: 10px;
  margin-bottom: 0.25rem;
`;

const FileMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.25rem;
`;

const MessageTime = styled.div<{ $isOwn: boolean }>`
  font-size: 0.75rem;
  color: ${props => props.$isOwn ? 'rgba(255, 255, 255, 0.8)' : '#666'};
  text-align: right;
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  color: #666;
  font-style: italic;
  font-size: 0.875rem;
`;

const InputContainer = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.90) 100%);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  position: relative;
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-xl);
  padding: 1rem 1.25rem;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all var(--transition-md) ease;
  
  &::placeholder {
    color: var(--text-secondary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-gradient-start);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-md) ease;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity var(--transition-sm);
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: var(--shadow-md), 0 0 20px rgba(102, 126, 234, 0.4);
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
  
  &:disabled {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

const FileInput = styled.input`
  display: none;
`;

const MediaInput = styled.input`
  display: none;
`;

const DocumentInput = styled.input`
  display: none;
`;

const CameraInput = styled.input`
  display: none;
`;

const AttachmentMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  bottom: 60px;
  left: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
`;

const AttachmentOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  min-width: 160px;
  text-align: left;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const AttachmentIcon = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const MediaContainer = styled.div`
  margin-bottom: 0.5rem;
`;

const VideoMessage = styled.video`
  max-width: 300px;
  max-height: 200px;
  border-radius: 10px;
  margin-bottom: 0.25rem;
`;

const AudioMessage = styled.audio`
  width: 250px;
  margin-bottom: 0.25rem;
`;

const DocumentMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
`;

const FileButton = styled.button`
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-secondary);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-md) ease;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
  font-size: 1.2rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: var(--primary-gradient-start);
    color: var(--primary-gradient-start);
    transform: translateY(-2px) scale(1.05);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;
`;

interface ChatWindowProps {
  user: User;
  currentChat: User | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  isTyping: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  currentChat,
  messages,
  onSendMessage,
  onSendFile,
  onStartTyping,
  onStopTyping,
  isTyping
}) => {
  const [messageText, setMessageText] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    // Handle typing indicators
    if (!isTypingLocal && e.target.value.length > 0) {
      setIsTypingLocal(true);
      onStartTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingLocal) {
        setIsTypingLocal(false);
        onStopTyping();
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() && currentChat) {
      onSendMessage(messageText.trim());
      setMessageText('');
      
      // Stop typing indicator
      if (isTypingLocal) {
        setIsTypingLocal(false);
        onStopTyping();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentChat) {
      console.log('📁 Selected file:', file.name, 'Type:', file.type);
      onSendFile(file);
    }
    e.target.value = '';
    setAttachmentMenuOpen(false);
  };

  const handleAttachmentClick = () => {
    setAttachmentMenuOpen(!attachmentMenuOpen);
  };

  const handleMediaSelect = () => {
    mediaInputRef.current?.click();
  };

  const handleDocumentSelect = () => {
    documentInputRef.current?.click();
  };

  const handleCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'doc': case 'docx': return 'DOC';
      case 'xls': case 'xlsx': return 'XLS';
      case 'ppt': case 'pptx': return 'PPT';
      case 'txt': return 'TXT';
      case 'zip': case 'rar': return 'ZIP';
      default: return 'FILE';
    }
  };

  const isVideoFile = (fileName: string) => {
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return videoExts.includes(ext || '');
  };

  const isAudioFile = (fileName: string) => {
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return audioExts.includes(ext || '');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentChat) {
    return (
      <ChatWindowContainer>
        <EmptyChat>
          <div>
            <h3>Welcome to WhatsApp Clone!</h3>
            <p>Select a conversation to start messaging</p>
          </div>
        </EmptyChat>
      </ChatWindowContainer>
    );
  }

  return (
    <ChatWindowContainer>
      <ChatHeader>
        <Avatar 
          $isOnline={currentChat.isOnline}
          $profilePicture={currentChat.profilePicture}
          onClick={() => setShowUserProfile(true)}
        >
          {!currentChat.profilePicture && currentChat.username.charAt(0).toUpperCase()}
        </Avatar>
        <ContactInfo>
          <ContactName>{currentChat.username}</ContactName>
          <ContactStatus>
            {currentChat.isOnline ? 'Online' : `Last seen ${formatTime(currentChat.lastSeen)}`}
          </ContactStatus>
        </ContactInfo>
      </ChatHeader>

      <MessagesContainer>
        {messages.map((message) => {
          const isOwn = String(message.sender._id) === String(user._id);
          console.log('🔍 Message ownership check:', {
            messageId: message._id,
            senderId: message.sender._id,
            senderIdType: typeof message.sender._id,
            currentUserId: user._id,
            currentUserIdType: typeof user._id,
            isOwn: isOwn,
            senderName: message.sender.username,
            content: message.content
          });
          
          return (
            <MessageBubble key={message._id} $isOwn={isOwn}>
              <MediaContainer>
                {/* Image Display */}
                {message.messageType === 'image' && (
                  <MessageImage 
                    src={`http://localhost:8000${message.fileUrl}`}
                    alt="Shared image"
                    loading="lazy"
                    onClick={() => window.open(`http://localhost:8000${message.fileUrl}`, '_blank')}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                
                {/* Video Display */}
                {message.messageType === 'video' && (
                  <VideoMessage 
                    controls
                    preload="metadata"
                  >
                    <source src={`http://localhost:8000${message.fileUrl}`} />
                    Your browser does not support video playback.
                  </VideoMessage>
                )}
                
                {/* Audio Display */}
                {message.messageType === 'audio' && (
                  <AudioMessage 
                    controls
                    preload="metadata"
                  >
                    <source src={`http://localhost:8000${message.fileUrl}`} />
                    Your browser does not support audio playback.
                  </AudioMessage>
                )}
                
                {/* Enhanced File/Document Display */}
                {message.messageType === 'file' && (
                  <DocumentMessage 
                    onClick={() => window.open(`http://localhost:8000${message.fileUrl}`, '_blank')}
                  >
                    <DocumentIcon>
                      {getFileIcon(message.fileName || 'file')}
                    </DocumentIcon>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        {message.fileName || 'Unknown file'}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {message.fileSize ? formatFileSize(message.fileSize) : 'Unknown size'}
                      </div>
                    </div>
                  </DocumentMessage>
                )}
                
                {/* Auto-detect video files sent as 'file' type */}
                {message.messageType === 'file' && message.fileName && isVideoFile(message.fileName) && (
                  <VideoMessage 
                    controls
                    preload="metadata"
                  >
                    <source src={`http://localhost:8000${message.fileUrl}`} />
                    Your browser does not support video playback.
                  </VideoMessage>
                )}
                
                {/* Auto-detect audio files sent as 'file' type */}
                {message.messageType === 'file' && message.fileName && isAudioFile(message.fileName) && (
                  <AudioMessage 
                    controls
                    preload="metadata"
                  >
                    <source src={`http://localhost:8000${message.fileUrl}`} />
                    Your browser does not support audio playback.
                  </AudioMessage>
                )}
              </MediaContainer>
              
              {message.content && (
                <MessageContent>{message.content}</MessageContent>
              )}
              
              <MessageTime $isOwn={isOwn}>
                {formatTime(message.createdAt)}
                {isOwn && ' ✓'}
              </MessageTime>
            </MessageBubble>
          );
        })}
        
        {isTyping && (
          <TypingIndicator>
            {currentChat.username} is typing...
          </TypingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <div style={{ position: 'relative' }}>
          <FileButton onClick={handleAttachmentClick}>
            📎
          </FileButton>
          
          <AttachmentMenu $isOpen={attachmentMenuOpen}>
            <AttachmentOption onClick={handleMediaSelect}>
              <AttachmentIcon style={{ background: '#e91e63' }}>🖼️</AttachmentIcon>
              <div>
                <div>Photos & Videos</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Share images and videos</div>
              </div>
            </AttachmentOption>
            
            <AttachmentOption onClick={handleCameraSelect}>
              <AttachmentIcon style={{ background: '#2196f3' }}>📷</AttachmentIcon>
              <div>
                <div>Camera</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Take a photo or video</div>
              </div>
            </AttachmentOption>
            
            <AttachmentOption onClick={handleDocumentSelect}>
              <AttachmentIcon style={{ background: '#4caf50' }}>📄</AttachmentIcon>
              <div>
                <div>Document</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Share files and documents</div>
              </div>
            </AttachmentOption>
          </AttachmentMenu>
        </div>
        
        {/* Hidden file inputs for different media types */}
        <MediaInput
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
        
        <CameraInput
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileSelect}
        />
        
        <DocumentInput
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,audio/*"
          onChange={handleFileSelect}
        />
        
        <FileInput
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileSelect}
        />
        
        <MessageInput
          value={messageText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />
        
        <SendButton 
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
        >
          ➤
        </SendButton>
      </InputContainer>
      
      {/* User Profile Modal */}
      {currentChat && (
        <UserProfileModal
          user={currentChat}
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          isOnline={currentChat.isOnline}
        />
      )}
    </ChatWindowContainer>
  );
};

export default ChatWindow;
