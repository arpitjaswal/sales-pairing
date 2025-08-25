import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string, userData: any) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.userId = userId;
    
    // Get the socket URL from environment variables
    const isProduction = import.meta.env.PROD;
    const defaultUrl = isProduction ? 'https://sales-pairing.onrender.com' : 'http://localhost:5001';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultUrl;
    console.log('Environment:', isProduction ? 'production' : 'development');
    console.log('Connecting to WebSocket at:', socketUrl);
    
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Join with user data
      this.socket?.emit('user-join', {
        id: userId,
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || userId.slice(0, 6),
        email: userData.email || `${userId}@example.com`,
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  // Update availability
  updateAvailability(isAvailable: boolean) {
    if (this.socket && this.userId) {
      this.socket.emit('update-availability', {
        userId: this.userId,
        isAvailable,
      });
    }
  }

  // Send invitation
  sendInvitation(targetUserId: string, topic: string, skillLevel: string, sessionLength: number) {
    if (this.socket && this.userId) {
      this.socket.emit('send-invitation', {
        userId: this.userId,
        targetUserId,
        topic,
        skillLevel,
        sessionLength,
      });
    }
  }

  // Accept invitation
  acceptInvitation(requestId: string, userId?: string) {
    if (this.socket) {
      this.socket.emit('accept-invitation', {
        requestId,
        userId: userId || this.userId,
      });
    }
  }

  // Decline invitation
  declineInvitation(requestId: string) {
    if (this.socket && this.userId) {
      this.socket.emit('decline-invitation', {
        requestId,
        userId: this.userId,
      });
    }
  }

  // Event listeners
  onAvailableUsers(callback: (users: any[]) => void) {
    this.socket?.on('available-users', callback);
  }

  onUserJoined(callback: (user: any) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (user: any) => void) {
    this.socket?.on('user-left', callback);
  }

  onUserAvailabilityChanged(callback: (data: any) => void) {
    this.socket?.on('user-availability-changed', callback);
  }

  onInvitationReceived(callback: (invitation: any) => void) {
    this.socket?.on('invitation-received', callback);
  }

  onInvitationSent(callback: (invitation: any) => void) {
    this.socket?.on('invitation-sent', callback);
  }

  onInvitationDeclined(callback: (data: any) => void) {
    this.socket?.on('invitation-declined', callback);
  }

  onSessionStarted(callback: (session: any) => void) {
    this.socket?.on('session-started', callback);
  }

  sendSessionMessage(sessionId: string, message: string, senderId: string, senderName: string) {
    if (this.socket) {
      this.socket.emit('send-session-message', {
        sessionId,
        message,
        senderId,
        senderName,
      });
    }
  }

  onSessionMessageReceived(callback: (data: any) => void) {
    this.socket?.on('session-message-received', callback);
  }

  onSessionEnded(callback: (data: any) => void) {
    this.socket?.on('session-ended', callback);
  }

  // Remove event listeners
  off(event: string) {
    this.socket?.off(event);
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).websocketService = websocketService;
}
