// Mock for pdf-parse library
export = jest.fn().mockImplementation((buffer: Buffer) => {
  // For testing purposes, return mock data based on buffer content
  const content = buffer.toString();

  if (content.includes('Hello PDF')) {
    return Promise.resolve({
      text: 'Hello PDF',
      numpages: 1,
      info: {},
    });
  }

  return Promise.resolve({
    text: content,
    numpages: 1,
    info: {},
  });
});
