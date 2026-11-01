import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import MapView from 'react-native-maps';

import ParkingMarker from '../components/ParkingMarker';
import ParkingBottomSheet from '../components/ParkingBottomSheet';
import { getParkingById } from '../src/services/FETCH-API.js';
import useParkingsPolling from '../src/hooks/useParkingsPolling';
import useSelectedParkingPolling from '../src/hooks/useSelectedParkingPolling';

export default function ParkingMapScreen() {
  const [selectedParking, setSelectedParking] = useState(null);
  const [parkings, setParkings] = useState([]);

  useParkingsPolling(setParkings);
  useSelectedParkingPolling(selectedParking?.parkingId, setSelectedParking);

  const handleMarkerPress = async (parking) => {
    const detail = await getParkingById(parking.parkingId);
    if (detail) setSelectedParking(detail.parking);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -34.9011,
          longitude: -56.1645,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {parkings.map((parking) => (
          <ParkingMarker
            key={parking.parkingId}
            parking={parking}
            onPress={() => handleMarkerPress(parking)}
          />
        ))}
      </MapView>

      <ParkingBottomSheet
        parking={selectedParking}
        onClose={() => setSelectedParking(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});