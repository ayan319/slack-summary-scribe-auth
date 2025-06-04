
import React from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SlackOAuthButton = () => {
  const { toast } = useToast();

  const { data: authUrl, isLoading } = useQuery({
    queryKey: ['slack-auth-url'],
    queryFn: async () => {
      try {
        console.log('Fetching Slack auth URL...');
        const { data, error } = await supabase.functions.invoke('slack-auth-url');
        
        if (error) {
          console.error('Error fetching auth URL:', error);
          throw error;
        }
        
        console.log('Auth URL response:', data);
        return data?.url;
      } catch (error) {
        console.error('Failed to get Slack auth URL:', error);
        toast({
          title: "Error",
          description: "Failed to connect to Slack. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const handleSlackAuth = () => {
    console.log('Slack auth button clicked, auth URL:', authUrl);
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      toast({
        title: "Error",
        description: "Authorization URL not available. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleSlackAuth}
      disabled={!authUrl || isLoading}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
      {isLoading ? 'Loading...' : 'Add to Slack'}
    </Button>
  );
};

export default SlackOAuthButton;
