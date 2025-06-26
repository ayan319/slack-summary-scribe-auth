import React from "react";
import { TestSlackEvent } from "./components/TestSlackEvent";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Slack Summarizer Test</h1>
      <TestSlackEvent />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
