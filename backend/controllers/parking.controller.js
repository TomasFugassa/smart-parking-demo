import { parkingSchema } from '../validations/parking_schema.js';
import * as db from '../db/db.js';

export async function getParkings() {
  return db.getParkings();
}

export async function getParkingById(id) {
  const parking = await db.getParkingById(id);
  if (!parking) return null;

  const sensors = await db.getSensorsByParking(id);
  const totalSpaces = parking.totalSpaces || 0;
  const occupiedSpaces = Object.values(sensors).filter(s => s.isOccupied).length;
  const availableSpaces = totalSpaces - occupiedSpaces;
  const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

  return { parking, sensors, statistics: { totalSpaces, occupiedSpaces, availableSpaces, occupancyRate } };
}

export async function upsertParking(parkingId, body) {
  const parsed = parkingSchema.safeParse({ ...body, parkingId });
  if (!parsed.success) {
    return { error: 'Validation failed', status: 400, details: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.getParkingById(parkingId);
  const isNew = !existing;
  const record = await db.upsertParking(parsed.data, isNew);

  return { isNew, record };
}

export async function deleteParking(parkingId) {
  const parking = await db.getParkingById(parkingId);
  if (!parking) return { error: 'Parking not found', status: 404 };

  await db.deleteParkingById(parkingId);
  return {};
}
