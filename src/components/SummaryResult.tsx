
import React from 'react';
import { SummaryDisplay } from './SummaryDisplay';
import { SummaryData } from '../types/summary';

interface SummaryResultProps {
  summary: SummaryData | null;
}

export const SummaryResult: React.FC<SummaryResultProps> = ({ summary }) => {
  if (!summary) {
    return null;
  }

  return <SummaryDisplay summary={summary} />;
};
