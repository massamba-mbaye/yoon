import { auth, db } from '@/config/firebase';
import { sendPushNotification } from '@/config/notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Trip {
  id: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  driverName: string;
  driverRating: number;
  driverTripsCount: number;
  driverId: string;
}

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadTripDetails();
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  };

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'trips', id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTrip({
          id: docSnap.id,
          ...docSnap.data()
        } as Trip);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour réserver');
      router.push('/auth');
      return;
    }

    if (!trip) return;

    if (trip.driverId === user.uid) {
      Alert.alert('Erreur', 'Vous ne pouvez pas réserver votre propre trajet');
      return;
    }

    const seats = parseInt(seatsToBook);

    if (isNaN(seats) || seats < 1) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins 1 place');
      return;
    }

    if (seats > trip.availableSeats) {
      Alert.alert('Erreur', `Seulement ${trip.availableSeats} place(s) disponible(s)`);
      return;
    }

    const existingBookingQuery = query(
      collection(db, 'bookings'),
      where('tripId', '==', trip.id),
      where('passengerId', '==', user.uid),
      where('status', '==', 'confirmed')
    );
    const existingBookings = await getDocs(existingBookingQuery);
    
    if (!existingBookings.empty) {
      Alert.alert('Erreur', 'Vous avez déjà une réservation pour ce trajet');
      return;
    }

    Alert.alert(
      'Confirmer la réservation',
      `Réserver ${seats} place(s) pour ${seats * trip.price} CFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setBookingLoading(true);

              await addDoc(collection(db, 'bookings'), {
                tripId: trip.id,
                passengerId: user.uid,
                passengerName: userData?.name || 'Utilisateur',
                passengerPhone: userData?.phone || '',
                driverId: trip.driverId,
                seatsBooked: seats,
                totalPrice: seats * trip.price,
                status: 'confirmed',
                createdAt: new Date().toISOString(),
              });

              const tripRef = doc(db, 'trips', trip.id);
              await updateDoc(tripRef, {
                availableSeats: increment(-seats)
              });

              // Envoyer une notification au conducteur
              try {
                const driverDoc = await getDoc(doc(db, 'users', trip.driverId));
                const driverData = driverDoc.data();

                if (driverData?.pushToken) {
                  await sendPushNotification(
                    driverData.pushToken,
                    '🎉 Nouvelle réservation !',
                    `${userData?.name || 'Un passager'} a réservé ${seats} place(s) pour ${trip.departure} → ${trip.destination}`,
                    { 
                      screen: '/my-trips',
                      tripId: trip.id 
                    }
                  );
                }
              } catch (notifError) {
                console.error('Erreur envoi notification:', notifError);
              }

              Alert.alert(
                'Succès',
                'Votre réservation a été confirmée !',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur réservation:', error);
              Alert.alert('Erreur', 'Impossible de réserver. Veuillez réessayer.');
            } finally {
              setBookingLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trajet introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnTrip = auth.currentUser?.uid === trip.driverId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du trajet</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.routeContainer}>
          <View style={styles.cityBlock}>
            <Text style={styles.cityLabel}>Départ</Text>
            <Text style={styles.cityName}>{trip.departure}</Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
          
          <View style={styles.cityBlock}>
            <Text style={styles.cityLabel}>Arrivée</Text>
            <Text style={styles.cityName}>{trip.destination}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations du trajet</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{trip.date}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Heure de départ</Text>
            <Text style={styles.infoValue}>{trip.time}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💺</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Places disponibles</Text>
            <Text style={styles.infoValue}>{trip.availableSeats} place(s)</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💰</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Prix par passager</Text>
            <Text style={styles.priceValue}>{trip.price} CFA</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conducteur</Text>
        
        <View style={styles.driverContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{trip.driverName.charAt(0)}</Text>
          </View>
          
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{trip.driverName}</Text>
            <View style={styles.driverStats}>
              <Text style={styles.statText}>⭐ {trip.driverRating}</Text>
              <Text style={styles.statSeparator}>•</Text>
              <Text style={styles.statText}>{trip.driverTripsCount} trajets</Text>
            </View>
          </View>
        </View>
      </View>

      {!isOwnTrip && trip.availableSeats > 0 && (
        <View style={styles.bookingSection}>
          <Text style={styles.bookingTitle}>Réserver des places</Text>
          
          <View style={styles.seatsSelector}>
            <Text style={styles.seatsLabel}>Nombre de places :</Text>
            <TextInput
              style={styles.seatsInput}
              value={seatsToBook}
              onChangeText={setSeatsToBook}
              keyboardType="numeric"
              maxLength={1}
            />
          </View>

          <View style={styles.totalPrice}>
            <Text style={styles.totalPriceLabel}>Total :</Text>
            <Text style={styles.totalPriceValue}>
              {(parseInt(seatsToBook) || 0) * trip.price} CFA
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.bookButton, bookingLoading && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={bookingLoading}
          >
            <Text style={styles.bookButtonText}>
              {bookingLoading ? 'Réservation...' : 'Réserver'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwnTrip && (
        <View style={styles.ownTripNotice}>
          <Text style={styles.ownTripText}>C'est votre trajet</Text>
        </View>
      )}

      {trip.availableSeats === 0 && !isOwnTrip && (
        <View style={styles.fullTripNotice}>
          <Text style={styles.fullTripText}>Trajet complet</Text>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  card: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    marginTop: 20,
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
    justifyContent: 'space-between',
  },
  cityBlock: {
    flex: 1,
  },
  cityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  arrowContainer: {
    marginHorizontal: 15,
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  statSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  bookingSection: {
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
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  seatsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  seatsLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  seatsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    width: 60,
    textAlign: 'center',
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: '#a8c7e7',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ownTripNotice: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ownTripText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: '600',
  },
  fullTripNotice: {
    backgroundColor: '#F8D7DA',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullTripText: {
    fontSize: 16,
    color: '#721C24',
    fontWeight: '600',
  },
});