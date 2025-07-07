// Shared user storage for mock authentication
// In production, this would be replaced with actual database operations

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
}

// Mock user storage (shared across signup/login)
// This persists during the server session but resets on restart
const mockUsers: User[] = [];

export const userStorage = {
  // Find user by email
  findByEmail: (email: string): User | undefined => {
    return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Find user by ID
  findById: (id: string): User | undefined => {
    return mockUsers.find(user => user.id === id);
  },

  // Create new user
  create: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    return newUser;
  },

  // Get all users (for debugging)
  getAll: (): User[] => {
    return [...mockUsers]; // Return copy to prevent external modification
  },

  // Check if email exists
  emailExists: (email: string): boolean => {
    return mockUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Get user count
  count: (): number => {
    return mockUsers.length;
  }
};

// Export for debugging (remove in production)
export const debugUserStorage = () => {
  console.log('Current users in storage:', mockUsers.map(u => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email, 
    createdAt: u.createdAt 
  })));
};
