import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { User } from '../types/index';

const SettingsOverlay = styled.div<{ $isOpen: boolean }>`
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

const SettingsModal = styled.div`
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  
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

const SettingsHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
  color: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  position: relative;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 1.2rem;
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

const SettingsContent = styled.div`
  padding: 2rem;
`;

const ProfilePictureSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ProfilePictureContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
`;

const ProfilePicture = styled.div<{ $profilePicture?: string }>`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: ${props => 
    props.$profilePicture 
      ? `url(http://localhost:8000${props.$profilePicture}) center/cover` 
      : 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-xl);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity var(--transition-md);
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const ProfilePictureOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  opacity: 0;
  transition: opacity var(--transition-md);
  cursor: pointer;
  
  ${ProfilePicture}:hover & {
    opacity: 1;
  }
`;

const UploadButton = styled.button`
  background: linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-600) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-md);
  margin: 0 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &:disabled {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
    transform: none;
  }
`;

const RemoveButton = styled.button`
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-md);
  margin: 0 0.5rem;
  
  &:hover {
    background: rgba(244, 67, 54, 0.2);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
`;

const UserInfo = styled.div`
  text-align: center;
  margin-top: 1rem;
  
  h3 {
    margin: 0 0 0.5rem;
    color: var(--text-primary);
    font-size: 1.25rem;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
`;

const StatusSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusLabel = styled.label`
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all var(--transition-md);
  
  &::placeholder {
    color: var(--text-secondary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(var(--primary-500-rgb), 0.1);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StatusActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const StatusButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${props => 
    props.$variant === 'primary' 
      ? 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)'
      : 'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.$variant === 'primary' ? 'white' : 'var(--text-primary)'};
  border: 1px solid ${props => 
    props.$variant === 'primary' 
      ? 'transparent'
      : 'rgba(255, 255, 255, 0.2)'
  };
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-md);
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CharacterCount = styled.div<{ $isNearLimit: boolean }>`
  text-align: right;
  font-size: 0.75rem;
  color: ${props => props.$isNearLimit ? '#f44336' : 'var(--text-secondary)'};
  margin-top: 0.25rem;
`;

interface ProfileSettingsProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (user: User) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(user.status || '');
  const [originalStatus, setOriginalStatus] = useState(user.status || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_STATUS_LENGTH = 150;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = sessionStorage.getItem('token');
      console.log('📝 Token for profile upload:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        setError('Please login again to upload profile picture');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/users/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile picture updated successfully!');
        onProfileUpdate(data.user);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create empty form data to clear profile picture
      const formData = new FormData();
      const emptyFile = new File([''], 'empty.png', { type: 'image/png' });
      formData.append('profilePicture', emptyFile);

      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile picture removed successfully!');
        // Update user with empty profile picture
        onProfileUpdate({ ...data.user, profilePicture: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Remove profile picture error:', error);
      setError('Failed to remove profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (statusText.trim() === originalStatus.trim()) {
      setError('No changes to save');
      return;
    }

    if (statusText.length > MAX_STATUS_LENGTH) {
      setError(`Status must be ${MAX_STATUS_LENGTH} characters or less`);
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Please login again to update status');
        return;
      }

      const response = await fetch('http://localhost:8000/api/users/status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusText.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Status updated successfully!');
        setOriginalStatus(statusText.trim());
        onProfileUpdate(data.user);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelStatus = () => {
    setStatusText(originalStatus);
    setError(null);
    setSuccess(null);
  };

  const hasStatusChanged = statusText.trim() !== originalStatus.trim();
  const isNearLimit = statusText.length > MAX_STATUS_LENGTH * 0.8;
  const isOverLimit = statusText.length > MAX_STATUS_LENGTH;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <SettingsOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <SettingsModal>
        <SettingsHeader>
          <h2>Profile Settings</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </SettingsHeader>

        <SettingsContent>
          <ProfilePictureSection>
            <ProfilePictureContainer>
              <ProfilePicture
                $profilePicture={user.profilePicture}
                onClick={() => fileInputRef.current?.click()}
              >
                {!user.profilePicture && user.username.charAt(0).toUpperCase()}
                <ProfilePictureOverlay>
                  📷
                </ProfilePictureOverlay>
              </ProfilePicture>
            </ProfilePictureContainer>

            <div>
              <UploadButton
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading && <LoadingSpinner />}
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </UploadButton>

              {user.profilePicture && (
                <RemoveButton
                  onClick={handleRemoveProfilePicture}
                  disabled={isUploading}
                >
                  Remove Photo
                </RemoveButton>
              )}
            </div>

            <FileInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
          </ProfilePictureSection>

          <UserInfo>
            <h3>{user.username}</h3>
            <p>{user.email}</p>
            {user.status && (
              <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "{user.status}"
              </p>
            )}
          </UserInfo>

          <StatusSection>
            <StatusLabel htmlFor="status-textarea">
              About / Status
            </StatusLabel>
            <StatusTextarea
              id="status-textarea"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Write something about yourself... (e.g., 'Hey there! I am using WhatsApp.')"
              maxLength={MAX_STATUS_LENGTH}
            />
            <CharacterCount $isNearLimit={isNearLimit || isOverLimit}>
              {statusText.length}/{MAX_STATUS_LENGTH}
            </CharacterCount>
            
            {hasStatusChanged && (
              <StatusActions>
                <StatusButton
                  type="button"
                  onClick={handleCancelStatus}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </StatusButton>
                <StatusButton
                  type="button"
                  $variant="primary"
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus || isOverLimit}
                >
                  {isUpdatingStatus && <LoadingSpinner />}
                  {isUpdatingStatus ? 'Saving...' : 'Save Status'}
                </StatusButton>
              </StatusActions>
            )}
          </StatusSection>
        </SettingsContent>
      </SettingsModal>
    </SettingsOverlay>
  );
};

export default ProfileSettings;
