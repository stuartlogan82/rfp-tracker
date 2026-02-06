/**
 * @jest-environment node
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock the dependencies BEFORE importing anything else
jest.mock('@/lib/file-parser');
jest.mock('@/lib/openai');
jest.mock('openai', () => {
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
  return {
    __esModule: true,
    default: mockOpenAI,
  };
});

import { POST } from './route';
import { NextRequest } from 'next/server';
import * as fileParser from '@/lib/file-parser';
import * as openai from '@/lib/openai';
import { prisma } from '@/lib/db';

describe('POST /api/extract', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Clean up database
    await prisma.document.deleteMany({});
    await prisma.deadline.deleteMany({});
    await prisma.rfp.deleteMany({});
  });

  it('extracts dates from a text document', async () => {
    // Create test RFP and document
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'test.pdf',
        filepath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
      },
    });

    // Mock file parser to return text
    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockResolvedValue({
      text: 'Proposal deadline is March 15, 2024',
      isImage: false,
    });

    // Mock OpenAI to return dates
    const mockExtractDates = openai.extractDates as jest.MockedFunction<typeof openai.extractDates>;
    mockExtractDates.mockResolvedValue([
      {
        date: '2024-03-15',
        time: null,
        label: 'Proposal deadline',
        context: 'Final submission'
      }
    ]);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    // Call API
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dates).toHaveLength(1);
    expect(data.dates[0]).toEqual({
      date: '2024-03-15',
      time: null,
      label: 'Proposal deadline',
      context: 'Final submission'
    });

    // Verify file parser was called correctly
    expect(mockExtractText).toHaveBeenCalledWith('/uploads/test.pdf', 'application/pdf');

    // Verify OpenAI was called with extracted text
    expect(mockExtractDates).toHaveBeenCalledWith('Proposal deadline is March 15, 2024');
  });

  it('extracts dates from an image document', async () => {
    // Create test RFP and document
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'scan.png',
        filepath: '/uploads/scan.png',
        mimeType: 'image/png',
      },
    });

    // Mock file parser to indicate image
    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockResolvedValue({
      text: '',
      isImage: true,
    });

    // Mock OpenAI vision to return dates
    const mockExtractDatesFromImage = openai.extractDatesFromImage as jest.MockedFunction<typeof openai.extractDatesFromImage>;
    mockExtractDatesFromImage.mockResolvedValue([
      {
        date: '2024-04-10',
        time: '10:00',
        label: 'Site visit',
        context: 'Mandatory inspection'
      }
    ]);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    // Call API
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dates).toHaveLength(1);
    expect(data.dates[0]).toEqual({
      date: '2024-04-10',
      time: '10:00',
      label: 'Site visit',
      context: 'Mandatory inspection'
    });

    // Verify file parser was called
    expect(mockExtractText).toHaveBeenCalledWith('/uploads/scan.png', 'image/png');

    // Verify OpenAI vision was called with filepath
    expect(mockExtractDatesFromImage).toHaveBeenCalledWith('/uploads/scan.png');
  });

  it('returns 400 when documentId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Document ID is required');
  });

  it('returns 404 when document does not exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: 99999 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Document not found');
  });

  it('returns 500 when OpenAI API fails', async () => {
    // Create test RFP and document
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'test.pdf',
        filepath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
      },
    });

    // Mock file parser to return text
    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockResolvedValue({
      text: 'Sample text',
      isImage: false,
    });

    // Mock OpenAI to fail
    const mockExtractDates = openai.extractDates as jest.MockedFunction<typeof openai.extractDates>;
    mockExtractDates.mockRejectedValue(new Error('API rate limit exceeded'));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    // Call API
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to extract dates');
  });

  it('returns 200 with empty dates when document has no extractable text', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'blank.pdf',
        filepath: '/uploads/blank.pdf',
        mimeType: 'application/pdf',
      },
    });

    // Mock file parser to return empty text
    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockResolvedValue({
      text: '',
      isImage: false,
    });

    // Mock OpenAI to return no dates for empty text
    const mockExtractDates = openai.extractDates as jest.MockedFunction<typeof openai.extractDates>;
    mockExtractDates.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dates).toEqual([]);
    expect(mockExtractDates).toHaveBeenCalledWith('');
  });

  it('returns 200 with empty dates when document contains no date information', async () => {
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'no-dates.pdf',
        filepath: '/uploads/no-dates.pdf',
        mimeType: 'application/pdf',
      },
    });

    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockResolvedValue({
      text: 'This document has no dates in it, just general information about the project.',
      isImage: false,
    });

    const mockExtractDates = openai.extractDates as jest.MockedFunction<typeof openai.extractDates>;
    mockExtractDates.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dates).toEqual([]);
  });

  it('returns 500 when file parsing fails', async () => {
    // Create test RFP and document
    const rfp = await prisma.rfp.create({
      data: {
        name: 'Test RFP',
        agency: 'Test Agency',
      },
    });

    const document = await prisma.document.create({
      data: {
        rfpId: rfp.id,
        filename: 'corrupt.pdf',
        filepath: '/uploads/corrupt.pdf',
        mimeType: 'application/pdf',
      },
    });

    // Mock file parser to fail
    const mockExtractText = fileParser.extractText as jest.MockedFunction<typeof fileParser.extractText>;
    mockExtractText.mockRejectedValue(new Error('Failed to read file'));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: document.id }),
    });

    // Call API
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to extract dates');
  });
});
