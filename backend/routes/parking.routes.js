import { Router } from 'express';
import * as parkingController from '../controllers/parking.controller.js';

const router = Router();

router.get('/parkings', async (req, res) => {
  const parkings = await parkingController.getParkings();
  res.json(parkings);
});

router.get('/parkings/:id', async (req, res) => {
  const result = await parkingController.getParkingById(req.params.id);
  if (!result) return res.status(404).json({ error: 'Parking not found' });
  res.json(result);
});

router.put('/parkings/:parkingId', async (req, res) => {
  const result = await parkingController.upsertParking(req.params.parkingId, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(result.isNew ? 201 : 200).json({ message: result.isNew ? 'Parking created' : 'Parking updated', record: result.record });
});

router.delete('/parkings/:parkingId', async (req, res) => {
  const result = await parkingController.deleteParking(req.params.parkingId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json({ message: 'Parking deleted' });
});

export default router;
