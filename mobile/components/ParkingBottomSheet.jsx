import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ParkingBottomSheet({ parking, onClose }) {
  if (!parking) return null;

  const layout = Object.values(parking.layout);
  const occupied = layout.filter(space => space.isOccupied).length;
  const available = parking.totalSpaces - occupied;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.name}>{parking.name}</Text>
      <Text style={styles.spaces}>Total spaces: {parking.totalSpaces}</Text>
      <Text style={styles.spaces}>Available spaces: {available}</Text>
      <Text style={styles.spaces}>Occupied spaces: {occupied}</Text>
      <TouchableOpacity onPress={onClose} style={styles.close}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginBottom: 16,
  },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  spaces: { color: '#94a3b8', fontSize: 16, marginTop: 4 },
  close: { marginTop: 16, alignItems: 'center' },
  closeText: { color: '#60a5fa', fontWeight: '600' },
});