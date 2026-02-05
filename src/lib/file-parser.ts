/**
 * File parser library for extracting text from various document formats
 */

import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ExtractionResult {
  text: string;
  isImage?: boolean;
}

/**
 * Extracts text from a file based on its MIME type
 * @param filepath - Absolute path to the file
 * @param mimeType - MIME type of the file
 * @returns Extracted text or image flag
 */
export async function extractText(
  filepath: string,
  mimeType: string
): Promise<ExtractionResult> {
  // Handle image files - flag for vision API processing
  const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
  if (imageTypes.includes(mimeType.toLowerCase())) {
    return {
      text: '',
      isImage: true,
    };
  }

  // Handle plain text files
  if (mimeType.toLowerCase() === 'text/plain') {
    return extractPlainText(filepath);
  }

  // Handle supported document types
  switch (mimeType.toLowerCase()) {
    case 'application/pdf':
      return extractPdf(filepath);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(filepath);
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return extractXlsx(filepath);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function extractPlainText(filepath: string): Promise<ExtractionResult> {
  const text = await fs.readFile(filepath, 'utf-8');
  return {
    text,
  };
}

async function extractPdf(filepath: string): Promise<ExtractionResult> {
  const dataBuffer = await fs.readFile(filepath);
  const data = await pdfParse(dataBuffer);

  return {
    text: data.text,
  };
}

async function extractDocx(filepath: string): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ path: filepath });

  return {
    text: result.value,
  };
}

async function extractXlsx(filepath: string): Promise<ExtractionResult> {
  const dataBuffer = await fs.readFile(filepath);
  const workbook = XLSX.read(dataBuffer, { type: 'buffer' });

  // Extract text from all sheets
  const textParts: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to CSV format for readable text extraction
    const sheetText = XLSX.utils.sheet_to_csv(worksheet);
    if (sheetText.trim()) {
      textParts.push(`Sheet: ${sheetName}\n${sheetText}`);
    }
  });

  return {
    text: textParts.join('\n\n'),
  };
}
