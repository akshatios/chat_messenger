import React, { useState } from 'react';
import styled from 'styled-components';
import { User } from '../types';
import { userAPI } from '../services/api';

const SearchContainer = styled.div`
  margin-top: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const SearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.5rem;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 5px;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const Avatar = styled.div<{ $isOnline?: boolean }>`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.875rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => props.$isOnline ? '#4caf50' : '#9e9e9e'};
    border: 2px solid white;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
`;

const Email = styled.div`
  color: #666;
  font-size: 0.8rem;
`;

const NoResults = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const Loading = styled.div`
  padding: 1rem;
  text-align: center;
  color: #667eea;
  font-size: 0.9rem;
`;

interface UserSearchProps {
  onUserSelect: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setSearched(false);

    if (searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.searchUsers(searchQuery);
      setUsers(response.data.users);
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder="Search users by username or email..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <SearchResults>
        {loading && (
          <Loading>Searching...</Loading>
        )}
        
        {!loading && searched && users.length === 0 && query.length >= 2 && (
          <NoResults>No users found</NoResults>
        )}
        
        {!loading && users.map((user) => (
          <UserItem key={user._id} onClick={() => onUserSelect(user)}>
            <Avatar $isOnline={user.isOnline}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <UserInfo>
              <Username>{user.username}</Username>
              <Email>{user.email}</Email>
            </UserInfo>
          </UserItem>
        ))}
      </SearchResults>
    </SearchContainer>
  );
};

export default UserSearch;
