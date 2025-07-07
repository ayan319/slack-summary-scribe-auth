// Simple in-memory store for fallback mode when Supabase tables don't exist
// This is only used during development/testing when database isn't set up

interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  created_at: string;
}

interface Summary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  channel_name: string;
  message_count: number;
  created_at: string;
}

interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slack_team_id: string;
  connected: boolean;
  created_at: string;
}

// In-memory stores (reset on server restart)
const users: User[] = [];
const summaries: Summary[] = [];
const workspaces: Workspace[] = [];

export const fallbackStore = {
  // User operations
  users: {
    findByEmail: (email: string): User | null => {
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    
    findById: (id: string): User | null => {
      return users.find(u => u.id === id) || null;
    },
    
    create: (userData: Omit<User, 'id' | 'created_at'>): User => {
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...userData,
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      return newUser;
    },

    update: (id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): User | null => {
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex === -1) return null;

      users[userIndex] = { ...users[userIndex], ...updates };
      return users[userIndex];
    },
    
    getAll: (): User[] => [...users]
  },
  
  // Summary operations
  summaries: {
    findByUserId: (userId: string, limit?: number): Summary[] => {
      const userSummaries = summaries
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return limit ? userSummaries.slice(0, limit) : userSummaries;
    },
    
    countByUserId: (userId: string): number => {
      return summaries.filter(s => s.user_id === userId).length;
    },
    
    countByUserIdThisMonth: (userId: string): number => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      return summaries.filter(s => 
        s.user_id === userId && 
        new Date(s.created_at) >= startOfMonth
      ).length;
    },
    
    create: (summaryData: Omit<Summary, 'id' | 'created_at'>): Summary => {
      const newSummary: Summary = {
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...summaryData,
        created_at: new Date().toISOString()
      };
      summaries.push(newSummary);
      return newSummary;
    }
  },
  
  // Workspace operations
  workspaces: {
    findByUserId: (userId: string): Workspace[] => {
      return workspaces
        .filter(w => w.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    
    create: (workspaceData: Omit<Workspace, 'id' | 'created_at'>): Workspace => {
      const newWorkspace: Workspace = {
        id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...workspaceData,
        created_at: new Date().toISOString()
      };
      workspaces.push(newWorkspace);
      return newWorkspace;
    }
  },
  
  // Utility functions
  reset: () => {
    users.length = 0;
    summaries.length = 0;
    workspaces.length = 0;
  },
  
  seed: (userId: string) => {
    // Create some sample workspaces
    fallbackStore.workspaces.create({
      user_id: userId,
      name: 'Demo Workspace',
      slack_team_id: 'T1234567890',
      connected: true
    });
    
    fallbackStore.workspaces.create({
      user_id: userId,
      name: 'Project Alpha',
      slack_team_id: 'T0987654321',
      connected: true
    });
    
    // Create some sample summaries
    fallbackStore.summaries.create({
      user_id: userId,
      title: 'Daily Standup - Sprint Planning',
      content: 'Team discussed upcoming sprint goals and identified blockers.',
      channel_name: 'general',
      message_count: 15
    });
    
    fallbackStore.summaries.create({
      user_id: userId,
      title: 'Technical Architecture Review',
      content: 'Reviewed microservices architecture and scalability concerns.',
      channel_name: 'engineering',
      message_count: 23
    });
    
    fallbackStore.summaries.create({
      user_id: userId,
      title: 'Product Roadmap Discussion',
      content: 'Product team aligned on Q2 roadmap priorities.',
      channel_name: 'product',
      message_count: 31
    });
  },
  
  getStats: () => ({
    totalUsers: users.length,
    totalSummaries: summaries.length,
    totalWorkspaces: workspaces.length
  })
};
