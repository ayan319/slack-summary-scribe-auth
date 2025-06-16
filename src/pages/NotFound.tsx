
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertTriangle className="h-24 w-24 text-orange-400" />
              <div className="absolute -top-2 -right-2 bg-red-100 rounded-full p-2">
                <span className="text-red-600 font-bold text-lg">404</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            The URL <code className="bg-gray-100 px-2 py-1 rounded text-xs">{location.pathname}</code> couldn't be found.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/dashboard" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-gray-500 mb-3">Need help? Try these popular pages:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/slack-test">Slack Test</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
