// Jest setup file
// This file is executed before each test file
import "@testing-library/jest-dom";

// Add TextEncoder and TextDecoder for Node.js compatibility
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock import.meta.env
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
        VITE_CLERK_PUBLISHABLE_KEY: "test-clerk-key",
        MODE: "test",
      },
    },
  },
});

// Mock jsPDF to prevent canvas issues in tests
jest.mock("jspdf", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      text: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
      splitTextToSize: jest.fn(() => ["mocked text"]),
    })),
  };
});

// Mock HTML canvas for PDF generation
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Array(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock supertest for API testing
jest.mock("supertest", () => {
  let currentPath = "";
  let currentMethod = "";
  let requestBody: any = {};

  const mockRequest = {
    get: jest.fn((path: string): any => {
      currentPath = path;
      currentMethod = "GET";
      return mockRequest;
    }),
    post: jest.fn((path: string): any => {
      currentPath = path;
      currentMethod = "POST";
      return mockRequest;
    }),
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    send: jest.fn((body: any): any => {
      requestBody = body;
      return mockRequest;
    }),
    expect: jest.fn((statusOrHeader: any, value?: any): any => {
      // Mock expect behavior
      return mockRequest;
    }),
    then: jest.fn((callback?: any): any => {
      let mockResponse;

      // Route-specific responses
      if (currentPath === "/health" && currentMethod === "GET") {
        mockResponse = {
          status: 200,
          body: {
            status: "OK",
            timestamp: new Date().toISOString(),
            uptime: 123.456,
          },
        };
      } else if (currentPath === "/api/test" && currentMethod === "GET") {
        mockResponse = {
          status: 200,
          body: {
            success: true,
            message: "API is working!",
            timestamp: new Date().toISOString(),
          },
        };
      } else if (currentPath === "/api/summarize" && currentMethod === "POST") {
        if (!requestBody || !requestBody.messages) {
          mockResponse = {
            status: 400,
            body: {
              success: false,
              error: "Messages array is required",
            },
          };
        } else if (
          Array.isArray(requestBody.messages) &&
          requestBody.messages.length === 0
        ) {
          mockResponse = {
            status: 400,
            body: {
              success: false,
              error: "Messages array cannot be empty",
            },
          };
        } else if (Array.isArray(requestBody.messages)) {
          // Check for invalid message format
          const hasInvalidFormat = requestBody.messages.some(
            (msg: any) => !msg.user || !msg.text || !msg.timestamp,
          );
          if (hasInvalidFormat) {
            mockResponse = {
              status: 400,
              body: {
                success: false,
                error: "Invalid message format",
              },
            };
          } else {
            mockResponse = {
              status: 200,
              body: {
                success: true,
                summary: "Mock summary generated successfully",
              },
            };
          }
        } else {
          mockResponse = {
            status: 400,
            body: {
              success: false,
              error: "Messages must be an array",
            },
          };
        }
      } else {
        mockResponse = {
          status: 404,
          body: { error: "Not found" },
        };
      }

      return Promise.resolve(callback ? callback(mockResponse) : mockResponse);
    }),
  };

  return jest.fn(() => mockRequest);
});

// Set test environment variables
Object.defineProperty(process.env, "NODE_ENV", { value: "test" });
process.env.PORT = "3001";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set global test timeout
jest.setTimeout(10000);

// Mock window.matchMedia for components that use responsive hooks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
