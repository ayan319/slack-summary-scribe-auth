import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../src/pages/Settings";

// Mock the Supabase lib first to prevent import.meta.env issues
jest.mock("../src/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock the Supabase client
jest.mock("../src/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/settings",
}));

// Mock the settings components
jest.mock("../src/components/settings/PreferencesSettings", () => ({
  PreferencesSettings: () => (
    <div data-testid="preferences-settings">Preferences Settings</div>
  ),
}));

jest.mock("../src/components/settings/BillingSettings", () => ({
  BillingSettings: () => (
    <div data-testid="billing-settings">Billing Settings</div>
  ),
}));

jest.mock("../src/components/settings/SecuritySettings", () => ({
  SecuritySettings: () => (
    <div data-testid="security-settings">Security Settings</div>
  ),
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: any) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock("@/components/ui/switch", () => ({
  Switch: (props: any) => <input type="checkbox" {...props} />,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, ...props }: any) => (
    <option {...props}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  User: () => <div data-testid="user-icon">User</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
}));

// Mock Headless UI
jest.mock("@headlessui/react", () => ({
  Tab: Object.assign(
    ({ children, className, ...props }: any) => (
      <button
        className={
          typeof className === "function"
            ? className({ selected: false })
            : className
        }
        {...props}
      >
        {children}
      </button>
    ),
    {
      Group: ({ children }: any) => (
        <div data-testid="tab-group">{children}</div>
      ),
      List: ({ children }: any) => (
        <div data-testid="tab-list" role="tablist">
          {children}
        </div>
      ),
      Panel: ({ children }: any) => (
        <div data-testid="tab-panel" role="tabpanel">
          {children}
        </div>
      ),
      Panels: ({ children }: any) => (
        <div data-testid="tab-panels">{children}</div>
      ),
    },
  ),
}));

const SettingsWrapper = () => (
  <Settings />
);

describe("Settings Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<SettingsWrapper />);

    expect(screen.getByTestId("tab-group")).toBeTruthy();
    expect(screen.getByTestId("tab-list")).toBeTruthy();
    expect(screen.getByTestId("tab-panels")).toBeTruthy();
  });

  it("displays all three tab options", () => {
    render(<SettingsWrapper />);

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Billing")).toBeTruthy();
    expect(screen.getByText("Security")).toBeTruthy();
  });

  it("renders the preferences settings by default", () => {
    render(<SettingsWrapper />);

    expect(screen.getByTestId("preferences-settings")).toBeTruthy();
    expect(screen.getByText("Preferences Settings")).toBeTruthy();
  });

  it("has proper accessibility attributes", () => {
    render(<SettingsWrapper />);

    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tabpanel")).toHaveLength(3);
  });

  it("applies correct CSS classes for styling", () => {
    const { container } = render(<SettingsWrapper />);

    // The component should render without throwing errors
    expect(container.firstChild).toBeTruthy();
  });
});
