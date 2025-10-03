import { TripCard } from '@/components/TripCard';
import { auth, db } from '@/config/firebase';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  driverId?: string;
}

export default function MyTripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTrips();
  }, []);

  const loadMyTrips = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      const q = query(
        collection(db, 'trips'),
        where('driverId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const tripsData: Trip[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        tripsData.push({
          id: docSnapshot.id,
          ...data
        } as Trip);
      });

      tripsData.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTrips(tripsData);
    } catch (error) {
      console.error('Erreur chargement trajets:', error);
      Alert.alert('Erreur', 'Impossible de charger vos trajets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    Alert.alert(
      'Supprimer le trajet',
      'Êtes-vous sûr de vouloir supprimer ce trajet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'trips', tripId));
              setTrips(trips.filter(t => t.id !== tripId));
              Alert.alert('Succès', 'Trajet supprimé');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le trajet');
            }
          }
        }
      ]
    );
  };

  const handleTripPress = (tripId: string) => {
    router.push({
      pathname: '/trip-details',
      params: { id: tripId }
    });
  };

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
        <Text style={styles.headerTitle}>Mes trajets publiés</Text>
      </View>

      <ScrollView style={styles.content}>
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>Aucun trajet publié</Text>
            <Text style={styles.emptySubtext}>
              Publiez votre premier trajet pour commencer
            </Text>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.publishButtonText}>Publier un trajet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tripsContainer}>
            <Text style={styles.count}>
              {trips.length} trajet{trips.length > 1 ? 's' : ''}
            </Text>
            
            {trips.map(trip => (
              <View key={trip.id} style={styles.tripWrapper}>
                <TripCard
                  trip={{
                    ...trip,
                    driver: {
                      name: trip.driverName,
                      rating: trip.driverRating,
                      tripsCount: trip.driverTripsCount
                    }
                  }}
                  onPress={() => handleTripPress(trip.id)}
                />
                
                <View style={styles.tripActions}>
                  <TouchableOpacity
                    style={styles.passengersButton}
                    onPress={() => router.push({
                      pathname: '/trip-passengers',
                      params: { 
                        id: trip.id,
                        departure: trip.departure,
                        destination: trip.destination
                      }
                    })}
                  >
                    <Text style={styles.passengersButtonText}>Voir les passagers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTrip(trip.id)}
                  >
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
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
  publishButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  publishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripsContainer: {
    padding: 20,
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  tripWrapper: {
    marginBottom: 20,
  },
  tripActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  passengersButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  passengersButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});