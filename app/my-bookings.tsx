import { auth, db } from '@/config/firebase';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Booking {
  id: string;
  tripId: string;
  seatsBooked: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  trip?: {
    departure: string;
    destination: string;
    date: string;
    time: string;
    driverName: string;
  };
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('MyBookingsScreen mounted');
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        console.log('No user, redirecting to auth');
        router.replace('/auth');
        return;
      }

      console.log('Loading bookings for user:', user.uid);

      const q = query(
        collection(db, 'bookings'),
        where('passengerId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      console.log('Number of bookings found:', querySnapshot.size);
      
      const bookingsData: Booking[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const bookingData = docSnapshot.data();
        console.log('Booking data:', bookingData);
        
        const tripDoc = await getDoc(doc(db, 'trips', bookingData.tripId));
        const tripData = tripDoc.exists() ? tripDoc.data() : null;
        
        bookingsData.push({
          id: docSnapshot.id,
          ...bookingData,
          trip: tripData ? {
            departure: tripData.departure,
            destination: tripData.destination,
            date: tripData.date,
            time: tripData.time,
            driverName: tripData.driverName,
          } : undefined
        } as Booking);
      }

      bookingsData.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      console.log('Total bookings loaded:', bookingsData.length);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Erreur', 'Impossible de charger vos réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleShareBooking = async (booking: Booking) => {
    if (!booking.trip) return;

    const message = `Ma réservation de covoiturage

${booking.trip.departure} → ${booking.trip.destination}
${booking.trip.date} à ${booking.trip.time}
${booking.seatsBooked} place(s) réservée(s)
Conducteur: ${booking.trip.driverName}
Prix: ${booking.totalPrice} CFA

Réservé via Yoon`;

    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'bookings', booking.id));

              const tripRef = doc(db, 'trips', booking.tripId);
              await updateDoc(tripRef, {
                availableSeats: increment(booking.seatsBooked)
              });

              setBookings(bookings.filter(b => b.id !== booking.id));

              Alert.alert('Succès', 'Réservation annulée');
            } catch (error) {
              console.error('Error canceling booking:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation');
            }
          }
        }
      ]
    );
  };

  const handleViewTripDetails = (tripId: string) => {
    router.push({
      pathname: '/trip-details',
      params: { id: tripId }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des réservations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes réservations</Text>
      </View>

      <ScrollView style={styles.content}>
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Recherchez un trajet et réservez votre place
            </Text>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.searchButtonText}>Rechercher un trajet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            <Text style={styles.count}>
              {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
            </Text>
            
            {bookings.map(booking => (
              <View key={booking.id} style={styles.bookingCard}>
                {booking.trip ? (
                  <>
                    <View style={styles.routeContainer}>
                      <Text style={styles.city}>{booking.trip.departure}</Text>
                      <Text style={styles.arrow}>→</Text>
                      <Text style={styles.city}>{booking.trip.destination}</Text>
                    </View>

                    <View style={styles.detailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{booking.trip.date}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Heure</Text>
                        <Text style={styles.detailValue}>{booking.trip.time}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Places réservées</Text>
                        <Text style={styles.detailValue}>{booking.seatsBooked}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Conducteur</Text>
                        <Text style={styles.detailValue}>{booking.trip.driverName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total payé</Text>
                        <Text style={styles.priceValue}>{booking.totalPrice} CFA</Text>
                      </View>
                    </View>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {booking.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                      </Text>
                    </View>

                    <View style={styles.actionsContainer}>
                      <TouchableOpacity 
                        style={styles.detailsButton}
                        onPress={() => handleViewTripDetails(booking.tripId)}
                      >
                        <Text style={styles.detailsButtonText}>Voir</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.shareButton}
                        onPress={() => handleShareBooking(booking)}
                      >
                        <Text style={styles.shareButtonText}>Partager</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking)}
                      >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={styles.errorText}>Trajet introuvable</Text>
                )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
    marginBottom: 30,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingsContainer: {
    padding: 20,
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  detailsContainer: {
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
  statusBadge: {
    backgroundColor: '#D4EDDA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#666',
    fontStyle: 'italic',
  },
});