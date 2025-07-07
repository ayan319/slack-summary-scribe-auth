import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock environment variables first
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-key";

// Mock the Supabase client
const mockInvoke = jest.fn();
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// Mock the Supabase lib
jest.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import SlackTest from "@/pages/SlackTest";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/slack-test",
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  TestTube: () => <div data-testid="test-tube-icon" />,
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <div data-testid="card-description" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
}));

const SlackTestWrapper = () => (
  <SlackTest />
);

describe("SlackTest Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockClear();
    mockToast.mockClear();
  });

  it("renders without crashing", () => {
    render(<SlackTestWrapper />);

    expect(screen.getAllByTestId("card")).toHaveLength(2);
    expect(screen.getByText(/test slack api connection/i)).toBeTruthy();
  });

  it("displays the test button", () => {
    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    expect(testButton).toBeTruthy();
    expect((testButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows loading state when test is running", async () => {
    // Mock a pending promise
    mockInvoke.mockImplementation(() => new Promise(() => {}));

    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect((testButton as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("handles successful test result", async () => {
    const successData = {
      success: true,
      message: "Connection successful",
      workspace: "Test Workspace",
    };

    mockInvoke.mockResolvedValue({ data: successData, error: null });

    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success!",
        description: "Slack API connection test completed successfully",
      });
    });
  });

  it("handles authentication errors", async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false, error: "Authentication failed" },
      error: null,
    });

    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Test Failed",
        description: "Authentication failed",
        variant: "destructive",
      });
    });
  });

  it("handles network errors", async () => {
    const networkError = new Error("Network error");
    mockInvoke.mockRejectedValue(networkError);

    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to test Slack connection",
        variant: "destructive",
      });
    });
  });

  it("calls Supabase function with correct parameters", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    render(<SlackTestWrapper />);

    const testButton = screen.getByRole("button", {
      name: /test slack connection/i,
    });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("slack-test", {
        body: { action: "test_auth" },
      });
    });
  });
});
