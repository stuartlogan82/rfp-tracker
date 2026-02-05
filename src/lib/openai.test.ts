import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Mock } from 'jest-mock';

// Mock the openai module before importing our code
jest.mock('openai');
jest.mock('fs');

import { extractDates, extractDatesFromImage } from './openai';
import OpenAI from 'openai';
import { readFileSync } from 'fs';

describe('openai', () => {
  let mockCreate: Mock;
  let mockReadFileSync: Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked OpenAI class
    const MockedOpenAI = OpenAI as unknown as jest.MockedClass<typeof OpenAI>;
    mockCreate = jest.fn() as Mock;

    // Setup the mock instance
    MockedOpenAI.prototype.chat = {
      completions: {
        create: mockCreate,
      },
    } as any;

    // Setup fs mock
    mockReadFileSync = readFileSync as unknown as Mock;
  });

  describe('extractDates', () => {
    it('returns an array of extracted dates from text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dates: [
                  {
                    date: '2024-03-15',
                    time: '14:00',
                    label: 'Proposal submission deadline',
                    context: 'All proposals must be submitted by this time'
                  },
                  {
                    date: '2024-03-20',
                    time: null,
                    label: 'Clarification deadline',
                    context: 'Last day for questions'
                  }
                ]
              })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const text = 'Proposal deadline is March 15, 2024 at 2pm. Questions accepted until March 20.';
      const result = await extractDates(text);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-03-15',
        time: '14:00',
        label: 'Proposal submission deadline',
        context: 'All proposals must be submitted by this time'
      });
      expect(result[1]).toEqual({
        date: '2024-03-20',
        time: null,
        label: 'Clarification deadline',
        context: 'Last day for questions'
      });
    });

    it('returns an empty array when no dates are found', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ dates: [] })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const text = 'This document contains no dates.';
      const result = await extractDates(text);

      expect(result).toEqual([]);
    });

    it('throws an error when OpenAI API fails', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      const text = 'Some text';
      await expect(extractDates(text)).rejects.toThrow('API rate limit exceeded');
    });

    it('throws an error when response is malformed', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Not valid JSON'
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const text = 'Some text';
      await expect(extractDates(text)).rejects.toThrow();
    });

    it('calls OpenAI with correct parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ dates: [] })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const text = 'Sample text';
      await extractDates(text);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system'
            }),
            expect.objectContaining({
              role: 'user',
              content: text
            })
          ]),
          response_format: { type: 'json_object' }
        })
      );
    });

    it('processes text under chunk size in a single call', async () => {
      // Text smaller than 50000 chars should not be chunked
      const smallText = 'Sample RFP with deadline on March 15, 2024.';

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dates: [
                  {
                    date: '2024-03-15',
                    time: null,
                    label: 'Deadline',
                    context: 'RFP deadline'
                  }
                ]
              })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await extractDates(smallText);

      // Should have called OpenAI only once for small text
      expect(mockCreate.mock.calls.length).toBe(1);
      expect(result.length).toBe(1);
    });

    it('deduplicates identical dates from response', async () => {
      const text = 'Sample text';

      // Simulate a response with duplicate dates
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dates: [
                  {
                    date: '2024-03-15',
                    time: null,
                    label: 'Deadline',
                    context: 'First occurrence'
                  },
                  {
                    date: '2024-03-15',
                    time: null,
                    label: 'Deadline',
                    context: 'Second occurrence'
                  },
                  {
                    date: '2024-03-20',
                    time: null,
                    label: 'Another date',
                    context: 'Different date'
                  }
                ]
              })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await extractDates(text);

      // Should deduplicate based on date + label
      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2024-03-15');
      expect(result[1].date).toBe('2024-03-20');
    });
  });

  describe('extractDatesFromImage', () => {
    it('extracts dates from an image file', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dates: [
                  {
                    date: '2024-04-10',
                    time: '10:30',
                    label: 'Site visit',
                    context: 'Mandatory site inspection'
                  }
                ]
              })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);
      mockReadFileSync.mockReturnValue(Buffer.from('fake-image-data'));

      const filepath = '/uploads/rfp-document.png';
      const result = await extractDatesFromImage(filepath);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-04-10',
        time: '10:30',
        label: 'Site visit',
        context: 'Mandatory site inspection'
      });
    });

    it('calls OpenAI vision API with correct parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ dates: [] })
            }
          }
        ]
      };

      mockCreate.mockResolvedValue(mockResponse);
      mockReadFileSync.mockReturnValue(Buffer.from('fake-image-data'));

      const filepath = '/uploads/test.jpg';
      await extractDatesFromImage(filepath);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system'
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url'
                })
              ])
            })
          ]),
          response_format: { type: 'json_object' }
        })
      );
    });

    it('throws an error when image processing fails', async () => {
      mockReadFileSync.mockReturnValue(Buffer.from('fake-image-data'));
      mockCreate.mockRejectedValue(new Error('Image processing failed'));

      const filepath = '/uploads/test.png';
      await expect(extractDatesFromImage(filepath)).rejects.toThrow('Image processing failed');
    });
  });
});
