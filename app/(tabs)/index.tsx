import { TripCard } from '@/components/TripCard';
import { db } from '@/config/firebase';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
}

export default function SearchScreen() {
  const router = useRouter();
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  const loadTrips = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'trips'));
      const tripsData: Trip[] = [];
      
      querySnapshot.forEach((doc) => {
        tripsData.push({
          id: doc.id,
          ...doc.data()
        } as Trip);
      });
      
      setAllTrips(tripsData);
      
      if (departure.trim() !== '' || destination.trim() !== '') {
        handleSearch(tripsData);
      } else {
        setFilteredTrips(tripsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (trips = allTrips) => {
    let filtered = trips;

    if (departure.trim() !== '') {
      filtered = filtered.filter(trip =>
        trip.departure.toLowerCase().includes(departure.toLowerCase())
      );
    }

    if (destination.trim() !== '') {
      filtered = filtered.filter(trip =>
        trip.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }

    setFilteredTrips(filtered);
  };

  const handleReset = () => {
    setDeparture('');
    setDestination('');
    setFilteredTrips(allTrips);
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
        <Text style={styles.loadingText}>Chargement des trajets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rechercher un trajet</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Départ</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Dakar"
          value={departure}
          onChangeText={setDeparture}
        />

        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Thiès"
          value={destination}
          onChangeText={setDestination}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.searchButton]} 
            onPress={() => handleSearch()}
          >
            <Text style={styles.buttonText}>🔍 Rechercher</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.resetButton]} 
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} trouvé{filteredTrips.length > 1 ? 's' : ''}
        </Text>
        
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun trajet trouvé</Text>
            <Text style={styles.emptySubtext}>
              Essayez avec d'autres villes ou réinitialisez la recherche
            </Text>
          </View>
        ) : (
          filteredTrips.map(trip => (
            <TripCard 
              key={trip.id} 
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
          ))
        )}
      </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});