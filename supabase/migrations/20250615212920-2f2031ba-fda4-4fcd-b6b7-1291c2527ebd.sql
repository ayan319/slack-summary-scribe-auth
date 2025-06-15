
-- Create summaries table for authenticated users
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transcript TEXT NOT NULL,
  summary JSONB NOT NULL, -- Store the structured summary data
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT -- Optional title for the summary
);

-- Add Row Level Security (RLS)
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own summaries
CREATE POLICY "Users can view their own summaries" 
  ON public.summaries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
  ON public.summaries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
  ON public.summaries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
  ON public.summaries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_summaries_user_id_timestamp ON public.summaries(user_id, timestamp DESC);
