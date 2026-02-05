// Mock for mammoth library
export const extractRawText = jest.fn().mockImplementation(({ path }: { path: string }) => {
  return Promise.resolve({
    value: 'Extracted DOCX text content',
    messages: [],
  });
});
