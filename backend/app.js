import express from 'express';

import { sseClients } from './sse.js';
import parkingRoutes from './routes/parking.routes.js';
import sensorRoutes from './routes/sensor.routes.js';
import corsMiddleware from './middleware/cors.js';
import bodyParserMiddleware from './middleware/bodyParser.js';

const app = express();

app.use(corsMiddleware);
app.use(bodyParserMiddleware);
app.use(parkingRoutes);
app.use(sensorRoutes);

app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);

  sseClients.push(res);

  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 10000);

  req.on('close', () => {
    clearInterval(keepAlive);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

export default app;
