import { z } from 'zod';

const idField = z.union([z.string(), z.number()]).transform(String);

export const sensorSchema = z.object({
  sensorId: idField,
  spaceId: idField,
  parkingId: idField,
  isOccupied: z.boolean(),
  distance: z.number().nonnegative().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  rssi: z.number().min(-100).max(0).optional(),
});
