import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Tag, Plus } from "lucide-react";
import { SummaryData, SUMMARY_TAGS, SummaryTag } from "@/types/summary";

interface SummaryRatingTagsProps {
  summary: SummaryData;
  onRatingChange: (rating: number) => void;
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export const SummaryRatingTags: React.FC<SummaryRatingTagsProps> = ({
  summary,
  onRatingChange,
  onTagsChange,
  className = "",
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("");

  const handleStarClick = (rating: number) => {
    onRatingChange(rating);
  };

  const handleAddTag = (tag: string) => {
    if (tag && !summary.tags?.includes(tag)) {
      const newTags = [...(summary.tags || []), tag];
      onTagsChange(newTags);
      setSelectedTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (summary.tags || []).filter((tag) => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => handleStarClick(star)}
        className="focus:outline-none transition-colors"
      >
        <Star
          className={`h-5 w-5 ${
            star <= (summary.userRating || 0)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 hover:text-yellow-400"
          }`}
        />
      </button>
    ));
  };

  return (
    <Card className={`border-t-0 rounded-t-none ${className}`}>
      <CardContent className="pt-4 space-y-4">
        {/* Rating Section */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Star className="h-4 w-4" />
            Your Rating:
          </span>
          <div className="flex gap-1">{renderStars()}</div>
          {summary.userRating && (
            <span className="text-sm text-gray-500">
              ({summary.userRating}/5)
            </span>
          )}
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags:
            </span>
            <div className="flex items-center gap-2">
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Add tag" />
                </SelectTrigger>
                <SelectContent>
                  {SUMMARY_TAGS.filter(
                    (tag) => !summary.tags?.includes(tag),
                  ).map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-xs">
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedTag && handleAddTag(selectedTag)}
                disabled={!selectedTag}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Display Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {summary.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
