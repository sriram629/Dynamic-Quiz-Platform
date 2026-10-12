import "@testing-library/jest-dom";
window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
window.matchMedia = jest
  .fn()
  .mockImplementation(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
