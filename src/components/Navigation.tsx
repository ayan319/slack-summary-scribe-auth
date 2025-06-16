
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart3, TestTube, Settings, Slack, Shield, Menu } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/slack-test', label: 'Test Slack', icon: TestTube },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/admin', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Slack className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Slack Summarizer</span>
            </Link>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to={item.path} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
          {/* Hamburger for Mobile */}
          <div className="md:hidden flex items-center">
            <button
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-purple-600" />
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 bg-white rounded-lg shadow-lg border px-4 py-2 flex flex-col space-y-2 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="w-full justify-start"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to={item.path} className="flex items-center space-x-2 w-full">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
