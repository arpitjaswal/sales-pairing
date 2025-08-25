import type { User } from '../contexts/AuthContext';

// Hardcoded demo user data
const DEMO_USER: User = {
  id: '1',
  email: 'demo@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const ADMIN_USER: User = {
  id: '2',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Simulate API delay
const simulateApiDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export const authService = {
  // Login user with hardcoded credentials
  async login(email: string, password: string): Promise<LoginResponse> {
    await simulateApiDelay();
    
    // Hardcoded login credentials
    if (email === 'demo@example.com' && password === 'demo123') {
      return {
        user: DEMO_USER,
        accessToken: 'demo-access-token-123',
        refreshToken: 'demo-refresh-token-123',
      };
    }
    
    if (email === 'admin@example.com' && password === 'admin123') {
      return {
        user: ADMIN_USER,
        accessToken: 'admin-access-token-123',
        refreshToken: 'admin-refresh-token-123',
      };
    }
    
    // Allow any email with password 'password' for testing
    if (password === 'password') {
      const testUser: User = {
        ...DEMO_USER,
        email,
        firstName: email.split('@')[0],
        lastName: 'User',
      };
      
      return {
        user: testUser,
        accessToken: 'test-access-token-123',
        refreshToken: 'test-refresh-token-123',
      };
    }
    
    throw new Error('Invalid email or password');
  },

  // Register new user (creates a new demo user)
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<RegisterResponse> {
    await simulateApiDelay();
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return {
      user: newUser,
      accessToken: 'new-user-access-token-123',
      refreshToken: 'new-user-refresh-token-123',
    };
  },

  // Logout user (just simulate success)
  async logout(): Promise<void> {
    await simulateApiDelay(500);
    // No API call needed for hardcoded auth
  },

  // Refresh access token (simulate token refresh)
  async refreshToken(_refreshToken: string): Promise<RefreshTokenResponse> {
    await simulateApiDelay(500);
    
    // Simulate token refresh
    return {
      accessToken: 'refreshed-access-token-123',
      refreshToken: 'refreshed-refresh-token-123',
    };
  },

  // Get current user (return stored user or demo user)
  async getCurrentUser(): Promise<User> {
    await simulateApiDelay(300);
    
    // Check if we have a stored user in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    // Return demo user as fallback
    return DEMO_USER;
  },

  // Forgot password (simulate success)
  async forgotPassword(email: string): Promise<void> {
    await simulateApiDelay();
    console.log(`Password reset email would be sent to: ${email}`);
    // Simulate success
  },

  // Reset password (simulate success)
  async resetPassword(_token: string, _password: string): Promise<void> {
    await simulateApiDelay();
    console.log(`Password would be reset with token: ${_token}`);
    // Simulate success
  },

  // Verify email (simulate success)
  async verifyEmail(token: string): Promise<void> {
    await simulateApiDelay();
    console.log(`Email would be verified with token: ${token}`);
    // Simulate success
  },

  // Resend verification email (simulate success)
  async resendVerificationEmail(email: string): Promise<void> {
    await simulateApiDelay();
    console.log(`Verification email would be resent to: ${email}`);
    // Simulate success
  },

  // Change password (simulate success)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await simulateApiDelay();
    console.log(`Password would be changed from ${currentPassword} to ${newPassword}`);
    // Simulate success
  },

  // Update profile (update stored user)
  async updateProfile(data: Partial<User>): Promise<User> {
    await simulateApiDelay();
    
    // Get current user
    const currentUser = await this.getCurrentUser();
    
    // Update user data
    const updatedUser = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
    
    // Store updated user
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return updatedUser;
  },

  // Update avatar (simulate success)
  async updateAvatar(_file: File): Promise<{ avatar: string }> {
    await simulateApiDelay();
    
    // Simulate file upload and return a demo avatar URL
    const avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
    
    // Update user's avatar
    const currentUser = await this.getCurrentUser();
    const updatedUser = { ...currentUser, avatar: avatarUrl };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return { avatar: avatarUrl };
  },

  // Delete avatar (simulate success)
  async deleteAvatar(): Promise<void> {
    await simulateApiDelay();
    
    // Remove avatar from user
    const currentUser = await this.getCurrentUser();
    const updatedUser = { ...currentUser, avatar: undefined };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  },
};

export default authService;
