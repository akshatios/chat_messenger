import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000');

  connect(userId: string): void {
    this.socket = io(this.SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send message
  sendMessage(message: any): void {
    if (this.socket) {
      console.log('Sending message via socket:', JSON.stringify(message));
      this.socket.emit('sendMessage', message);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  }

  // Listen for incoming messages
  onReceiveMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('receiveMessage', (message) => {
        console.log('Received message via socket:', JSON.stringify(message));
        callback(message);
      });
    }
  }

  // Listen for message sent confirmation
  onMessageSent(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('messageSent', (message) => {
        console.log('Message sent confirmation via socket:', JSON.stringify(message));
        callback(message);
      });
    }
  }

  // Send typing indicator
  sendTyping(recipientId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', {
        recipient: recipientId,
        isTyping
      });
    }
  }

  // Listen for typing indicators
  onUserTyping(callback: (data: { sender: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  // Listen for user online status
  onUserOnline(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('userOnline', callback);
    }
  }

  // Listen for user offline status
  onUserOffline(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('userOffline', callback);
    }
  }

  // Remove all listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
