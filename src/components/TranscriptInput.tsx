
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Mic, Send, Loader2 } from 'lucide-react';

interface TranscriptInputProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  isLoading: boolean;
  onSummarize: () => void;
}

export const TranscriptInput: React.FC<TranscriptInputProps> = ({
  transcript,
  setTranscript,
  isLoading,
  onSummarize
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTranscript(content);
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${file.name}`,
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
    }
  };

  const startVoiceRecording = () => {
    toast({
      title: "Voice Recording",
      description: "Voice-to-text feature coming soon!",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Interview Transcript
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Options */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload .txt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={startVoiceRecording}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Voice Input
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt"
          className="hidden"
        />

        <Textarea
          placeholder="Paste your interview transcript here or upload a .txt file..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={8}
          disabled={isLoading}
          className="resize-none"
        />

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {transcript.length} characters
          </span>
          <Button
            onClick={onSummarize}
            disabled={isLoading || !transcript.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Analyze Interview'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
