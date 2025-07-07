import React from "react";
import { render, screen } from "@testing-library/react";

// Simple component for testing
const TestComponent = () => {
  return <div>Hello Test</div>;
};

describe("Simple Test", () => {
  it("renders a simple component", () => {
    render(<TestComponent />);
    expect(screen.getByText("Hello Test")).toBeTruthy();
  });

  it("can find elements by role", () => {
    render(<button>Click me</button>);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
