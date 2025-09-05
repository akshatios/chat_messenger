import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Conversation } from '../types';
import { userAPI } from '../services/api';
import UserSearch from './UserSearch';
import ProfileSettings from './ProfileSettings';

const SidebarContainer = styled.div`
  width: 30%;
  min-width: 320px;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Header = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="white" opacity="0.1"/><circle cx="80" cy="40" r="0.8" fill="white" opacity="0.08"/><circle cx="40" cy="80" r="1.2" fill="white" opacity="0.06"/></svg>') repeat;
    animation: float 20s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div<{ $isOnline?: boolean; $profilePicture?: string; $clickable?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => 
    props.$profilePicture 
      ? `url(http://localhost:8000${props.$profilePicture}) center/cover` 
      : 'linear-gradient(135deg, var(--accent-500) 0%, var(--accent-600) 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  position: relative;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  border: 3px solid rgba(255, 255, 255, 0.2);
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  overflow: hidden;
  
  &:hover {
    transform: scale(${props => props.$clickable ? '1.1' : '1.05'});
    box-shadow: var(--shadow-lg);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${props => props.$isOnline ? 'var(--secondary-500)' : 'var(--neutral-400)'};
    border: 3px solid white;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
  }
`;

const Username = styled.div`
  font-weight: 600;
  color: var(--text-on-primary);
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-on-primary);
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all var(--transition-fast);
  position: relative;
  z-index: 2;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SearchSection = styled.div`
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--neutral-200);
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-600) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div<{ $isActive?: boolean }>`
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: ${props => props.$isActive ? 'rgba(18, 140, 126, 0.08)' : 'transparent'};
  transition: all var(--transition-fast);
  border-left: 4px solid ${props => props.$isActive ? 'var(--primary-500)' : 'transparent'};
  position: relative;
  
  &:hover {
    background: ${props => props.$isActive ? 'rgba(18, 140, 126, 0.12)' : 'var(--neutral-50)'};
    transform: translateX(2px);
  }
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 80px;
    right: 1.5rem;
    height: 1px;
    background: var(--neutral-200);
  }
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
`;

const LastMessage = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const UnreadBadge = styled.div`
  background: var(--secondary-500);
  color: white;
  border-radius: 50%;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  margin-top: 0.25rem;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
`;

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  currentChat: User | null;
  onChatSelect: (user: User) => void;
  onLogout: () => void;
  onlineUsers: string[];
  onUserUpdate?: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  conversations,
  currentChat,
  onChatSelect,
  onLogout,
  onlineUsers,
  onUserUpdate
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const handleUserSelect = async (selectedUser: User) => {
    onChatSelect(selectedUser);
    setShowSearch(false);
    
    // Add to contacts if not already added
    try {
      await userAPI.addContact(selectedUser._id);
    } catch (error) {
      // User might already be a contact, ignore error
    }
  };

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessageText = (conversation: Conversation) => {
    const message = conversation.lastMessage;
    if (message.messageType === 'image') {
      return '📷 Image';
    } else if (message.messageType === 'file') {
      return `📎 ${message.fileName}`;
    }
    return message.content || '';
  };

  const handleProfileClick = () => {
    setShowProfileSettings(true);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  return (
    <>
      <SidebarContainer>
        <Header>
          <UserInfo>
            <Avatar 
              $isOnline={true}
              $profilePicture={user.profilePicture}
              $clickable={true}
              onClick={handleProfileClick}
            >
              {!user.profilePicture && user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Username>{user.username}</Username>
          </UserInfo>
          <LogoutButton onClick={onLogout}>
            Logout
          </LogoutButton>
        </Header>

      <SearchSection>
        <SearchButton onClick={() => setShowSearch(!showSearch)}>
          {showSearch ? 'Close Search' : 'Find Users'}
        </SearchButton>
        {showSearch && (
          <UserSearch onUserSelect={handleUserSelect} />
        )}
      </SearchSection>

      <ConversationList>
        {conversations.length === 0 ? (
          <EmptyState>
            No conversations yet.<br />
            Search for users to start chatting!
          </EmptyState>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.contact._id}
              $isActive={currentChat?._id === conversation.contact._id}
              onClick={() => onChatSelect(conversation.contact)}
            >
              <Avatar 
                $isOnline={onlineUsers.includes(conversation.contact._id)}
                $profilePicture={conversation.contact.profilePicture}
              >
                {!conversation.contact.profilePicture && conversation.contact.username.charAt(0).toUpperCase()}
              </Avatar>
              <ContactInfo>
                <ContactName>{conversation.contact.username}</ContactName>
                <LastMessage>
                  {getLastMessageText(conversation)}
                </LastMessage>
              </ContactInfo>
              <div>
                <MessageTime>
                  {formatTime(conversation.lastMessage.createdAt)}
                </MessageTime>
                {conversation.unreadCount > 0 && (
                  <UnreadBadge>
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </UnreadBadge>
                )}
              </div>
            </ConversationItem>
          ))
        )}
      </ConversationList>
    </SidebarContainer>
    
    <ProfileSettings
      user={user}
      isOpen={showProfileSettings}
      onClose={() => setShowProfileSettings(false)}
      onProfileUpdate={handleProfileUpdate}
    />
  </>
  );
};

export default Sidebar;
