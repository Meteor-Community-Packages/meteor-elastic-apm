function newFibers() {
  function Fibers() {}

  const fibersInstance = new Fibers();

  Fibers.yield = jest.fn;
  Fibers.current = fibersInstance;
  Fibers.prototype.run = jest.fn();

  return Fibers;
}

module.exports = newFibers;
