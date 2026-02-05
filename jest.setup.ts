// Jest setup file for global test configuration
// Load environment variables for testing
import { config } from 'dotenv';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

config();

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
