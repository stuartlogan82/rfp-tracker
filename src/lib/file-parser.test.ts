/**
 * @jest-environment node
 */
import { extractText } from './file-parser';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock pdf-parse, mammoth, and xlsx to avoid Jest compatibility issues
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('xlsx');

describe('File Parser', () => {
  const testFilesDir = path.join(__dirname, '__test-files__');

  beforeAll(async () => {
    // Create test files directory
    await fs.mkdir(testFilesDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  describe('extractText', () => {
    it('throws error for unsupported file types', async () => {
      const filepath = path.join(testFilesDir, 'test.exe');
      await fs.writeFile(filepath, 'binary content');

      await expect(extractText(filepath, 'application/octet-stream')).rejects.toThrow(
        'Unsupported file type: application/octet-stream'
      );
    });

    it('returns empty object with isImage flag for PNG files', async () => {
      const filepath = path.join(testFilesDir, 'test.png');
      await fs.writeFile(filepath, Buffer.from([137, 80, 78, 71])); // PNG header

      const result = await extractText(filepath, 'image/png');

      expect(result).toEqual({
        text: '',
        isImage: true,
      });
    });

    it('returns empty object with isImage flag for JPEG files', async () => {
      const filepath = path.join(testFilesDir, 'test.jpg');
      await fs.writeFile(filepath, Buffer.from([255, 216, 255])); // JPEG header

      const result = await extractText(filepath, 'image/jpeg');

      expect(result).toEqual({
        text: '',
        isImage: true,
      });
    });

    it('returns empty object with isImage flag for TIFF files', async () => {
      const filepath = path.join(testFilesDir, 'test.tiff');
      await fs.writeFile(filepath, Buffer.from([73, 73, 42, 0])); // TIFF header

      const result = await extractText(filepath, 'image/tiff');

      expect(result).toEqual({
        text: '',
        isImage: true,
      });
    });

    it('extracts text from PDF files', async () => {
      // Create a minimal valid PDF file for testing
      const filepath = path.join(testFilesDir, 'test.pdf');
      // This is a minimal PDF with "Hello PDF" text
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

      await fs.writeFile(filepath, pdfContent);

      const result = await extractText(filepath, 'application/pdf');

      expect(result.isImage).toBeUndefined();
      expect(result.text).toContain('Hello PDF');
    });

    it('extracts text from DOCX files', async () => {
      const filepath = path.join(testFilesDir, 'test.docx');
      // Create a minimal DOCX file structure (it's a ZIP file)
      // For testing, we'll create a simple file and mock mammoth
      await fs.writeFile(filepath, 'mock docx content');

      const result = await extractText(
        filepath,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result.isImage).toBeUndefined();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
    });

    it('extracts text from XLSX files', async () => {
      const filepath = path.join(testFilesDir, 'test.xlsx');
      // Create a mock XLSX file
      await fs.writeFile(filepath, 'mock xlsx content');

      const result = await extractText(
        filepath,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      expect(result.isImage).toBeUndefined();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
    });
  });
});
