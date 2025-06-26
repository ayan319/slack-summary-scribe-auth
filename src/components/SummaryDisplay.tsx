import React from "react";
import { motion } from "framer-motion";

interface SummaryDisplayProps {
  summary: {
    summary?: string;
    skills?: string[];
    redFlags?: string[];
    actions?: string[];
  } | null;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  if (!summary) {
    return <div className="p-4 text-gray-500">No summary found.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 border rounded shadow"
    >
      <h3 className="text-lg font-bold mb-2">Summary</h3>
      <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm">
        {JSON.stringify(summary, null, 2)}
      </pre>
    </motion.div>
  );
};
