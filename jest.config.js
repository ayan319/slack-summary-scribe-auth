export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testEnvironment: "jsdom",
  roots: ["<rootDir>/app", "<rootDir>/lib", "<rootDir>/components", "<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/?(*.)+(spec|test).{ts,tsx}"],
  transform: {
    "^.+\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/.next/**",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
  },
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  globals: {
    "process.env": {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      DEEPSEEK_API_KEY: "test-deepseek-key",
      CASHFREE_APP_ID: "test-cashfree-app-id",
      CASHFREE_SECRET_KEY: "test-cashfree-secret",
      RESEND_API_KEY: "test-resend-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
};
