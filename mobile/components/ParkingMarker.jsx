import { Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';

export default function ParkingMarker({ parking, onPress }) {
  return (
    <Marker
      coordinate={{ latitude: parking.latitude, longitude: parking.longitude }}
      onPress={onPress}
    >
      <View style={styles.marker}>
        <Text style={styles.text}>P</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 16 },
});