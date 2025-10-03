import { db } from '@/config/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Passenger {
  id: string;
  passengerName: string;
  passengerPhone: string;
  seatsBooked: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Trip {
  departure: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
}

export default function TripPassengersScreen() {
  const { id, departure, destination } = useLocalSearchParams();
  const router = useRouter();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTripAndPassengers();
  }, [id]);

  const loadTripAndPassengers = async () => {
    try {
      setLoading(true);

      // Charger les infos du trajet
      const tripDoc = await getDoc(doc(db, 'trips', id as string));
      if (tripDoc.exists()) {
        setTrip(tripDoc.data() as Trip);
      }

      // Charger les passagers
      const q = query(
        collection(db, 'bookings'),
        where('tripId', '==', id),
        where('status', '==', 'confirmed')
      );

      const querySnapshot = await getDocs(q);
      const passengersData: Passenger[] = [];

      querySnapshot.forEach((doc) => {
        passengersData.push({
          id: doc.id,
          ...doc.data()
        } as Passenger);
      });

      // Trier par date de réservation
      passengersData.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setPassengers(passengersData);
    } catch (error) {
      console.error('Erreur chargement passagers:', error);
      Alert.alert('Erreur', 'Impossible de charger les passagers');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPassenger = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMSPassenger = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const totalSeatsBooked = passengers.reduce((sum, p) => sum + p.seatsBooked, 0);
  const totalRevenue = passengers.reduce((sum, p) => sum + p.totalPrice, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passagers</Text>
      </View>

      <ScrollView style={styles.content}>
        {trip && (
          <View style={styles.tripInfo}>
            <View style={styles.routeContainer}>
              <Text style={styles.city}>{trip.departure}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.city}>{trip.destination}</Text>
            </View>
            <Text style={styles.tripDate}>{trip.date} à {trip.time}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{passengers.length}</Text>
                <Text style={styles.statLabel}>Passager{passengers.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalSeatsBooked}</Text>
                <Text style={styles.statLabel}>Place{totalSeatsBooked > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{trip.availableSeats}</Text>
                <Text style={styles.statLabel}>Restante{trip.availableSeats > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.revenueBox}>
              <Text style={styles.revenueLabel}>Revenu total</Text>
              <Text style={styles.revenueValue}>{totalRevenue} CFA</Text>
            </View>
          </View>
        )}

        {passengers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Les passagers qui réserveront ce trajet apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.passengersContainer}>
            <Text style={styles.sectionTitle}>Liste des passagers</Text>
            
            {passengers.map((passenger, index) => (
              <View key={passenger.id} style={styles.passengerCard}>
                <View style={styles.passengerHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{passenger.passengerName.charAt(0)}</Text>
                  </View>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{passenger.passengerName}</Text>
                    <Text style={styles.passengerPhone}>{passenger.passengerPhone}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.passengerDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Places réservées</Text>
                    <Text style={styles.detailValue}>{passenger.seatsBooked}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Montant payé</Text>
                    <Text style={styles.priceValue}>{passenger.totalPrice} CFA</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Réservé le</Text>
                    <Text style={styles.detailValue}>
                      {new Date(passenger.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactButtons}>
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => handleCallPassenger(passenger.passengerPhone)}
                  >
                    <Text style={styles.callButtonText}>Appeler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.smsButton}
                    onPress={() => handleSMSPassenger(passenger.passengerPhone)}
                  >
                    <Text style={styles.smsButtonText}>SMS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    marginBottom: 10,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  tripInfo: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  tripDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  revenueBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  passengersContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  passengerCard: {
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
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  passengerPhone: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  passengerDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  smsButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  smsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});