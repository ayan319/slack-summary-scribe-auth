
import SlackOAuthButton from "@/components/SlackOAuthButton";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Slack Summarizer</h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect your Slack workspace to start summarizing conversations and channels
        </p>
        <div className="space-y-4">
          <SlackOAuthButton />
          <p className="text-sm text-gray-500">
            Clicking "Add to Slack" will redirect you to Slack to authorize this app
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
