import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
import { Search, Filter, X, Star } from "lucide-react";
import { SUMMARY_TAGS, FilterOptions } from "@/types/summary";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HistoryItem } from "@/types/summary";
import { FilterState } from "@/utils/filterStorage";

interface SummaryFiltersProps {
  summaries: HistoryItem[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onImportFilters: (filters: FilterState) => void;
}

export function SummaryFilters({
  summaries,
  filters,
  onFilterChange,
  onClearFilters,
  onImportFilters,
}: SummaryFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique values from summaries
  const uniqueSkills = Array.from(
    new Set(
      summaries.flatMap((summary) => (summary.summary as any).keySkills || []),
    ),
  ).sort();

  const uniqueRedFlags = Array.from(
    new Set(
      summaries.flatMap((summary) => (summary.summary as any).redFlags || []),
    ),
  ).sort();

  const uniqueActions = Array.from(
    new Set(
      summaries.flatMap(
        (summary) => (summary.summary as any).suggestedActions || [],
      ),
    ),
  ).sort();

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    onFilterChange({ skills: newSkills });
  };

  const handleRedFlagToggle = (flag: string) => {
    const newRedFlags = filters.redFlags.includes(flag)
      ? filters.redFlags.filter((f) => f !== flag)
      : [...filters.redFlags, flag];
    onFilterChange({ redFlags: newRedFlags });
  };

  const handleActionToggle = (action: string) => {
    const newActions = filters.actions.includes(action)
      ? filters.actions.filter((a) => a !== action)
      : [...filters.actions, action];
    onFilterChange({ actions: newActions });
  };

  const filteredSkills = uniqueSkills.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRedFlags = uniqueRedFlags.filter((flag) =>
    flag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredActions = uniqueActions.filter((action) =>
    action.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Filters</h3>
          {(filters.skills.length > 0 ||
            filters.redFlags.length > 0 ||
            filters.actions.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Skills Filter */}
          <div>
            <Label className="text-sm font-medium">Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Add Skills
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSkills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        <input
                          type="checkbox"
                          checked={filters.skills.includes(skill)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Red Flags Filter */}
          <div>
            <Label className="text-sm font-medium">Red Flags</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.redFlags.map((flag) => (
                <Badge
                  key={flag}
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => handleRedFlagToggle(flag)}
                >
                  {flag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Add Red Flags
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder="Search red flags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredRedFlags.map((flag) => (
                      <div
                        key={flag}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleRedFlagToggle(flag)}
                      >
                        <input
                          type="checkbox"
                          checked={filters.redFlags.includes(flag)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions Filter */}
          <div>
            <Label className="text-sm font-medium">Suggested Actions</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.actions.map((action) => (
                <Badge
                  key={action}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => handleActionToggle(action)}
                >
                  {action}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Add Actions
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                  <div className="max-h-60 overflow-y-auto">
                    {filteredActions.map((action) => (
                      <div
                        key={action}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleActionToggle(action)}
                      >
                        <input
                          type="checkbox"
                          checked={filters.actions.includes(action)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
