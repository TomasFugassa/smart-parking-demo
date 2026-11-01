import { useEffect, useRef } from 'react';
import { getParkings } from '../services/FETCH-API';

export default function useParkingsPolling(setParkings) {
  useEffect(() => {
    let active = true;

    const fetchParkings = async () => {
      const data = await getParkings();
      if (active) setParkings(Object.values(data));
    };

    fetchParkings();
    const interval = setInterval(fetchParkings, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);
}
