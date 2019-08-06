import { HTTP_INCOMING, EXECUTION, SENDING } from '../constants';

function start(agent, WebApp) {
  WebApp.connectHandlers.use(function(req, res, next) {
    const transaction = agent.startTransaction(`${req.method}:${req.url}`, HTTP_INCOMING);
    const span = agent.startSpan(EXECUTION);

    res.on('finish', () => {
      let route = req.originalUrl;
      if (req.originalUrl.endsWith(req.url.slice(1)) && req.url.length > 1) {
        route = req.originalUrl.slice(0, -1 * (req.url.length - 1));
      }
  
      if (route.endsWith('/')) {
        route = route.slice(0, -1);
      }
  
      if (route) {
        transaction.name = `${req.method}:${route}`;
      }

      span.end();
      transaction.__span = agent.startSpan(SENDING);
    });
    res.socket.on('close', () => {
      if (transaction) {
        if (transaction.__span) {
          transaction.__span.end();
        }
        transaction.end();
      }
    });

    next();
  });
}

module.exports = start;
