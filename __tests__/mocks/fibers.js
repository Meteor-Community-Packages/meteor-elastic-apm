const Fibers = {
  yield: jest.fn(),
  run: jest.fn(),
  current: {}
};

module.exports = Fibers;
