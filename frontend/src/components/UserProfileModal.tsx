import React from 'react';
import styled from 'styled-components';
import { User } from '../types/index';

const ProfileModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ProfileModalContainer = styled.div`
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 90%;
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
  
  @keyframes slideIn {
    from { 
      transform: translateY(-50px) scale(0.9);
      opacity: 0;
    }
    to { 
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const ProfileHeader = styled.div`
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
  color: white;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all var(--transition-md);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const LargeAvatar = styled.div<{ $profilePicture?: string; $isOnline?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => 
    props.$profilePicture 
      ? `url(http://localhost:8000${props.$profilePicture}) center/cover` 
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  font-weight: 600;
  margin: 0 auto 1rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${props => props.$isOnline ? '#4caf50' : '#9e9e9e'};
    border: 3px solid white;
  }
`;

const ProfileContent = styled.div`
  padding: 1.5rem 2rem 2rem;
  text-align: center;
`;

const Username = styled.h2`
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
`;

const Email = styled.p`
  margin: 0 0 1.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
`;

const StatusSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
`;

const StatusLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const StatusText = styled.div`
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.4;
  font-style: italic;
  text-align: left;
`;

const NoStatusText = styled.div`
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-style: italic;
  opacity: 0.7;
`;

const OnlineStatus = styled.div<{ $isOnline?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  background: ${props => props.$isOnline 
    ? 'rgba(76, 175, 80, 0.1)' 
    : 'rgba(158, 158, 158, 0.1)'
  };
  border: 1px solid ${props => props.$isOnline 
    ? 'rgba(76, 175, 80, 0.3)' 
    : 'rgba(158, 158, 158, 0.3)'
  };
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$isOnline ? '#4caf50' : '#9e9e9e'};
  }
`;

const OnlineStatusText = styled.span<{ $isOnline?: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isOnline ? '#4caf50' : '#9e9e9e'};
`;

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isOnline?: boolean;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  isOnline = false
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ProfileModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ProfileModalContainer>
        <ProfileHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <LargeAvatar 
            $profilePicture={user.profilePicture} 
            $isOnline={isOnline}
          >
            {!user.profilePicture && user.username.charAt(0).toUpperCase()}
          </LargeAvatar>
        </ProfileHeader>

        <ProfileContent>
          <Username>{user.username}</Username>
          <Email>{user.email}</Email>
          
          <OnlineStatus $isOnline={isOnline}>
            <OnlineStatusText $isOnline={isOnline}>
              {isOnline ? 'Online' : 'Offline'}
            </OnlineStatusText>
          </OnlineStatus>

          {user.status ? (
            <StatusSection>
              <StatusLabel>About</StatusLabel>
              <StatusText>"{user.status}"</StatusText>
            </StatusSection>
          ) : (
            <StatusSection>
              <StatusLabel>About</StatusLabel>
              <NoStatusText>No status set</NoStatusText>
            </StatusSection>
          )}
        </ProfileContent>
      </ProfileModalContainer>
    </ProfileModalOverlay>
  );
};

export default UserProfileModal;
