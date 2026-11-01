import { useEffect } from 'react';
import { getParkingById } from '../services/FETCH-API';

export default function useSelectedParkingPolling(parkingId, setSelectedParking) {
  useEffect(() => {
    if (!parkingId) return;

    let active = true;

    const interval = setInterval(async () => {
      const detail = await getParkingById(parkingId);
      if (detail && active) setSelectedParking(detail.parking);
    }, 3000);

    return () => { active = false; clearInterval(interval); };
  }, [parkingId]);
}
