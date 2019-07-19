/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import meteorMeasured from 'meteor/kschingiz:meteor-measured';

function startMetrics(agent) {
  const metrics = agent._metrics || {};

  // ugly hack to find metrics registry
  const registrySymbol = Object.getOwnPropertySymbols(metrics).find(
    symbol => symbol.toString() === 'Symbol(metrics-registry)'
  );

  const registry = metrics[registrySymbol];

  if (registry) {
    try {
      meteorMeasured(registry);
      agent.logger.debug('Successfully started meteor-measured');
    } catch (e) {
      agent.logger.error('Metrics could not be started');
      throw e;
    }
  } else {
    agent.logger.error('Metrics could not be started, agent registry not found');
  }
}

module.exports = startMetrics;
