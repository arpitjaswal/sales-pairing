// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

// Session related types
export interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  participants: Participant[];
  messages: Message[];
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  user: User;
  role: 'host' | 'participant';
  joinedAt: string;
  leftAt?: string;
  status: 'active' | 'inactive' | 'left';
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: string;
  type: 'text' | 'system' | 'file';
  metadata?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form related types
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  validate: () => boolean;
}

// UI related types
export interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
  roles?: string[];
}

// Error handling
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number = 500, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Component props
export interface ChildrenProps {
  children: React.ReactNode;
}

export interface ClassNameProps {
  className?: string;
}

export type WithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

// API Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
