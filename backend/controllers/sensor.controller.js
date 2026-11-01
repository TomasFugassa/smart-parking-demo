import { sensorSchema } from '../validations/sensor_schema.js';
import * as db from '../db/db.js';
import { broadcastEvent } from '../sse.js';

export async function getSensors() {
  return db.getSensors();
}

export async function upsertSensor(sensorId, body) {
  const parsed = sensorSchema.safeParse({ ...body, sensorId });
  if (!parsed.success) {
    return { error: 'Validation failed', status: 400, details: parsed.error.flatten().fieldErrors };
  }

  const payload = parsed.data;
  const parking = await db.getParkingById(payload.parkingId);
  if (!parking) return { error: 'Parking not found', status: 404 };

  if (!parking.layout || !parking.layout[payload.spaceId]) {
    return { error: `spaceId "${payload.spaceId}" does not exist in parking "${payload.parkingId}"`, status: 400 };
  }

  const existing = await db.getSensorById(sensorId);
  const isNew = !existing;

  const sensorAtSpace = await db.getSensorByParkingIdAndSpaceId(payload.parkingId, payload.spaceId);
  if (sensorAtSpace && sensorAtSpace.sensorId !== sensorId) {
    return { error: `spaceId "${payload.spaceId}" already has sensor "${sensorAtSpace.sensorId}" in parking "${payload.parkingId}"`, status: 409 };
  }

  const record = await db.upsertSensor(payload, isNew);
  broadcastEvent(record);

  return { isNew, record };
}

export async function deleteSensor(sensorId) {
  const sensor = await db.getSensorById(sensorId);
  if (!sensor) return { error: 'Sensor not found', status: 404 };

  await db.deleteSensorById(sensorId);
  return {};
}
