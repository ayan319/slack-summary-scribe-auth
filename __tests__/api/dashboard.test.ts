import { NextRequest } from 'next/server';
import { GET as dashboardHandler } from '@/app/api/dashboard/route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    slackToken: {
      findMany: jest.fn(),
    },
    summary: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/subscription', () => ({
  getUserSubscription: jest.fn(),
  getUserPlan: jest.fn(),
  getUserUsage: jest.fn(),
}));

describe('/api/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockSlackTokens = [
        {
          teamId: 'team-1',
          teamName: 'Test Team',
          createdAt: new Date(),
        },
      ];

      const mockSummaries = [
        {
          id: 'summary-1',
          title: 'Test Summary',
          channelName: 'general',
          messageCount: 10,
          createdAt: new Date(),
        },
      ];

      (requireAuth as jest.Mock).mockResolvedValue(mockUser);
      (prisma.slackToken.findMany as jest.Mock).mockResolvedValue(mockSlackTokens);
      (prisma.summary.count as jest.Mock).mockResolvedValue(5);
      (prisma.summary.findMany as jest.Mock).mockResolvedValue(mockSummaries);

      const { getUserSubscription, getUserPlan, getUserUsage } = require('@/lib/subscription');
      getUserSubscription.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' });
      getUserPlan.mockReturnValue('PRO');
      getUserUsage.mockResolvedValue({
        summariesThisMonth: 3,
        workspacesConnected: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe('user-1');
      expect(data.subscription.plan).toBe('PRO');
      expect(data.stats.totalSummaries).toBe(5);
      expect(data.slackWorkspaces).toHaveLength(1);
      expect(data.recentSummaries).toHaveLength(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (requireAuth as jest.Mock).mockResolvedValue(mockUser);
      (prisma.slackToken.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
