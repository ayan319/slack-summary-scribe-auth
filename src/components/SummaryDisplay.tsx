
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Star, 
  Download,
  TrendingUp,
  Target
} from 'lucide-react';
import { SummaryData } from '../types/summary';

interface SummaryDisplayProps {
  summary: SummaryData;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100';
    if (rating >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-current text-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-current text-yellow-300" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating / 2);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF download functionality
    console.log('Downloading PDF...');
  };

  const handleSaveToNotion = () => {
    // Placeholder for Notion integration
    console.log('Saving to Notion...');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Interview Analysis Results
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveToNotion}>
            Save to Notion
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Candidate Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{summary.candidateSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Key Skills & Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.keySkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Areas of Concern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {summary.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Rating Card */}
        <div className="space-y-6">
          <Card className="text-center border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Overall Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`text-4xl font-bold p-4 rounded-lg ${getRatingColor(summary.rating)}`}>
                {summary.rating}/10
              </div>
              
              <div className="flex justify-center gap-1">
                {getRatingStars(summary.rating)}
              </div>
              
              <Separator />
              
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Technical Skills:</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(summary.rating * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Communication:</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((summary.rating + 1) * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Cultural Fit:</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((summary.rating - 0.5) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Skills Identified:</span>
                <Badge variant="outline">{summary.keySkills.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Concerns Raised:</span>
                <Badge variant="outline">{summary.redFlags.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Action Items:</span>
                <Badge variant="outline">{summary.suggestedActions.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
