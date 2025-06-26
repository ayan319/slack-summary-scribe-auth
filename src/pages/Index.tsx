import SlackOAuthButton from "@/components/SlackOAuthButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Shield,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Real-time Summaries",
      description:
        "Get instant summaries of your Slack conversations and channels with AI-powered insights",
    },
    {
      icon: Shield,
      title: "Secure Integration",
      description:
        "Your data is safe with enterprise-grade security and OAuth authentication",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Share summaries with your team and stay aligned across all channels",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Track conversation trends and team engagement with detailed analytics",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      company: "TechFlow",
      content:
        "This tool has transformed how our team stays updated. No more missing important discussions!",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Engineering Lead",
      company: "DataCorp",
      content:
        "The AI summaries are incredibly accurate. It's like having a personal assistant for Slack.",
      rating: 5,
    },
  ];

  const benefits = [
    "Save 2+ hours daily on catching up",
    "Never miss important decisions",
    "Reduce information overload",
    "Improve team alignment",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6 animate-scale-in">
              <Zap className="h-4 w-4 mr-2" />
              AI-Powered Slack Summaries
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {" "}
                Slack
              </span>
              <br />
              Into Organized
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}
                Intelligence
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Stop drowning in Slack messages. Get AI-powered summaries of
              conversations, channels, and meetings to stay informed without the
              overwhelm.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="transform hover:scale-105 transition-transform duration-200">
                <SlackOAuthButton />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="group flex items-center space-x-2 hover:bg-gray-50 transition-all duration-200"
              >
                <span>View Dashboard</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>

            <p className="text-sm text-gray-500 mb-12">
              ✨ Free to start • No credit card required • 2-minute setup
            </p>

            {/* Benefits List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-gray-600 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for
              <span className="text-purple-600"> smarter communication</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to transform how your team stays
              connected and informed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group border-0 shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-lg text-gray-600">
              See what our users have to say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform your Slack experience?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams who are already using AI to stay on top of
            their conversations. Get started in less than 2 minutes.
          </p>
          <div className="transform hover:scale-105 transition-transform duration-200">
            <SlackOAuthButton />
          </div>
          <p className="text-purple-200 text-sm mt-6">
            No setup fees • Cancel anytime • Enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
