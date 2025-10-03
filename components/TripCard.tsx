import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Driver {
  name: string;
  rating: number;
  tripsCount: number;
}

interface Trip {
  id: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  driver: Driver;
}

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.routeContainer}>
          <Text style={styles.city}>{trip.departure}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.city}>{trip.destination}</Text>
        </View>
        <Text style={styles.price}>{trip.price} CFA</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>📅 {trip.date}</Text>
        <Text style={styles.detailText}>🕐 {trip.time}</Text>
        <Text style={styles.detailText}>💺 {trip.availableSeats} places</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {trip.driver.name.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.driverName}>{trip.driver.name}</Text>
            <Text style={styles.driverStats}>
              ⭐ {trip.driver.rating} • {trip.driver.tripsCount} trajets
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  city: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  arrow: {
    fontSize: 18,
    marginHorizontal: 8,
    color: '#007AFF',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  driverStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});