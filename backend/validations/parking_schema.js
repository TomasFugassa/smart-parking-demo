import { z } from 'zod';

const refineLayout = (data) => {
  if (data.layout && data.totalSpaces != null && Object.keys(data.layout).length !== data.totalSpaces) {
    return false;
  }
  return true;
};

export const parkingSchema = z.object({
  parkingId: z.union([z.string(), z.number()]).transform(String),
  name: z.string().trim().min(1, 'name is required').max(100),
  location: z.string().trim().min(1, 'location is required').max(200),
  totalSpaces: z.number().int().positive('totalSpaces must be a positive integer'),
  latitude: z.number().min(-90, 'latitude must be between -90 and 90').max(90, 'latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'longitude must be between -180 and 180').max(180, 'longitude must be between -180 and 180'),
  layout: z.record(z.object({
    spaceId: z.string(),
    isOccupied: z.boolean(),
  })).optional(),
}).refine(refineLayout, {
  message: 'totalSpaces must match the number of spaces in layout',
  path: ['totalSpaces'],
});
