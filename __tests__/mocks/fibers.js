function newFibers() {
  return {
    yield: jest.fn(),
    run: jest.fn(),
    current: {}
  };
}

module.exports = newFibers;
