// Jest setup file for global test configuration
// Load environment variables for testing
import { config } from 'dotenv';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

config();

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Node 18+ has fetch built-in, no need to polyfill
