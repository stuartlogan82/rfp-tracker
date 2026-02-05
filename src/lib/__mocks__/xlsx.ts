// Mock for xlsx library
export const read = jest.fn().mockImplementation(() => {
  return {
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {
        A1: { v: 'Header 1' },
        B1: { v: 'Header 2' },
        A2: { v: 'Value 1' },
        B2: { v: 'Value 2' },
      },
    },
  };
});

export const utils = {
  sheet_to_csv: jest.fn().mockImplementation(() => {
    return 'Header 1,Header 2\nValue 1,Value 2';
  }),
};
