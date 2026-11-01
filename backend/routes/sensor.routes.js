import { Router } from 'express';
import * as sensorController from '../controllers/sensor.controller.js';

const router = Router();

router.get('/sensors', async (req, res) => {
  const sensors = await sensorController.getSensors();
  res.json(sensors);
});

router.put('/sensors/:sensorId', async (req, res) => {
  const result = await sensorController.upsertSensor(req.params.sensorId, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error, details: result.details });
  res.status(result.isNew ? 201 : 200).json({ message: result.isNew ? 'Sensor created' : 'Sensor updated', record: result.record });
});

router.delete('/sensors/:parkingId/:sensorId', async (req, res) => {
  const result = await sensorController.deleteSensor(req.params.sensorId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json({ message: 'Sensor deleted' });
});

export default router;
