
import SlackOAuthButton from "@/components/SlackOAuthButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Zap, Shield, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Real-time Summaries",
      description: "Get instant summaries of your Slack conversations and channels"
    },
    {
      icon: Shield,
      title: "Secure Integration",
      description: "Your data is safe with enterprise-grade security and OAuth"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share summaries with your team and stay aligned"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track conversation trends and team engagement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Summarize Your Slack Conversations
            <span className="text-purple-600"> Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your Slack workspace into an organized knowledge base. 
            Get AI-powered summaries of conversations, channels, and meetings to stay on top of everything.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <SlackOAuthButton />
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Clicking "Add to Slack" will redirect you to Slack to authorize this app
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help your team communicate more effectively
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Connect your Slack workspace and start summarizing conversations today.
          </p>
          <SlackOAuthButton />
        </div>
      </div>
    </div>
  );
};

export default Index;
