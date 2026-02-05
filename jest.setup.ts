// Jest setup file for global test configuration
// Load environment variables for testing
import { config } from 'dotenv';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

config();

// Set a dummy OpenAI API key for tests (the actual client will be mocked)
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-api-key-for-mocking';
}

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill ResizeObserver for Radix UI components (used by shadcn/ui)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Node 18+ has fetch built-in, no need to polyfill
