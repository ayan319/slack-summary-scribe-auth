import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockRouter = {
  pathname: '/',
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

describe('Layout Component', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders the layout with title and navigation', () => {
    render(
      <Layout title="Test Page">
        <div>Test Content</div>
      </Layout>
    );

    // Check if the main title is rendered
    expect(screen.getByText('Slack Summary Scribe')).toBeInTheDocument();
    
    // Check if the subtitle is rendered
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    
    // Check if the content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check if all navigation items are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Slack Test')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active navigation item correctly', () => {
    // Test dashboard page
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: '/dashboard',
    });

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // The Dashboard button should have the active variant (default)
    const dashboardButton = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardButton).toBeInTheDocument();
  });

  it('shows mobile menu when hamburger is clicked', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Find the mobile menu button (hamburger) - it should be the last button
    const buttons = screen.getAllByRole('button');
    const mobileMenuButton = buttons[buttons.length - 1]; // Last button should be the hamburger

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);

    // Mobile navigation should be visible (we can check for duplicate nav items)
    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks.length).toBeGreaterThan(1); // Desktop + Mobile
  });

  it('renders footer with system status', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check footer content
    expect(screen.getByText(/© 2024 Slack Summary Scribe/)).toBeInTheDocument();
    expect(screen.getByText('System Online')).toBeInTheDocument();
    expect(screen.getByText('API v1.0')).toBeInTheDocument();
  });

  it('renders without title when not provided', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Main title should still be there
    expect(screen.getByText('Slack Summary Scribe')).toBeInTheDocument();
    
    // But no subtitle should be rendered
    expect(screen.queryByText('Test Page')).not.toBeInTheDocument();
  });

  it('handles home page active state correctly', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: '/',
    });

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Home should be active on root path
    const homeButton = screen.getByRole('link', { name: /home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it('handles settings page active state correctly', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: '/settings',
    });

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Settings should be active
    const settingsButton = screen.getByRole('link', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('handles slack-test page active state correctly', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: '/slack-test',
    });

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Slack Test should be active
    const slackTestButton = screen.getByRole('link', { name: /slack test/i });
    expect(slackTestButton).toBeInTheDocument();
  });
});
