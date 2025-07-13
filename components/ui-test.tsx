'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sun, 
  Moon, 
  Settings, 
  User, 
  FileText, 
  Upload,
  Download,
  Trash2,
  Edit,
  Save,
  X,
  Check
} from 'lucide-react';

export function UITest() {
  const [testValue, setTestValue] = useState('');

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              UI Component Test
              <ThemeToggle />
            </CardTitle>
            <CardDescription>
              Testing all UI components for visibility and functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Button Variants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Button Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Button Sizes</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Buttons with Icons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Buttons with Icons</h3>
              <div className="flex flex-wrap gap-2">
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
                <Button variant="secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="ghost">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            {/* Form Elements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Form Elements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Input Field</label>
                  <Input 
                    placeholder="Enter some text..." 
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Textarea</label>
                  <Textarea 
                    placeholder="Enter longer text..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Theme Toggle Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Theme Toggle</h3>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">
                  Click to toggle between light/dark/system themes
                </span>
              </div>
            </div>

            {/* Interactive Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interactive Test</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => alert('Button clicked!')}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Test Click
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setTestValue('')}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Input
                </Button>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status Indicators</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm">Offline</span>
                </div>
              </div>
            </div>

            {/* Current Values */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current State</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Input Value:</strong> {testValue || 'Empty'}
                </p>
                <p className="text-sm">
                  <strong>Theme:</strong> Check the theme toggle above
                </p>
                <p className="text-sm">
                  <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
