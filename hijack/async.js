function start(apm) {
  const Fibers = require("fibers");

  const originalYield = Fibers.yield;
  Fibers.yield = function() {
    const transaction = apm.currentTransaction;
    if (transaction) {
      const span = apm.startSpan();
      if (span) {
        span.name = "async";
        span.type = "async";
        Fibers.current._apmSpan = span;
      }
    }

    return originalYield();
  };

  const originalRun = Fibers.prototype.run;
  Fibers.prototype.run = function(val) {
    if (this._apmSpan) {
      const span = this._apmSpan;
      span.end();
      this._apmSpan = null;
    }
    return originalRun.call(this, val);
  };
}

module.exports = start;
