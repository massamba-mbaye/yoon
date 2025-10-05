import { TripCard } from '@/components/TripCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Chargement des trajets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol 
          name="magnifyingglass" 
          size={IconSizes.xl} 
          color={Colors.primary.main} 
        />
        <Text style={styles.title}>Rechercher un trajet</Text>
        <Text style={styles.subtitle}>
          Trouvez le covoiturage parfait pour votre voyage
        </Text>
      </View>
      
      {/* Formulaire de recherche */}
      <View style={styles.searchCard}>
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.sm} 
              color={Colors.primary.main} 
            />
            <Text style={styles.label}>Départ</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Dakar"
            placeholderTextColor={Colors.gray[400]}
            value={departure}
            onChangeText={setDeparture}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelContainer}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.sm} 
              color={Colors.secondary.main} 
            />
            <Text style={styles.label}>Destination</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Thiès"
            placeholderTextColor={Colors.gray[400]}
            value={destination}
            onChangeText={setDestination}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.searchButton]} 
            onPress={() => handleSearch()}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="magnifyingglass" 
              size={IconSizes.sm} 
              color={Colors.light.background} 
            />
            <Text style={styles.buttonText}>Rechercher</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.resetButton]} 
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="arrow.right" 
              size={IconSizes.sm} 
              color={Colors.primary.main} 
            />
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Résultats */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} disponible{filteredTrips.length > 1 ? 's' : ''}
          </Text>
          {filteredTrips.length > 0 && (
            <View style={styles.resultsBadge}>
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={IconSizes.sm} 
                color={Colors.secondary.main} 
              />
            </View>
          )}
        </View>
        
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol 
                name="magnifyingglass" 
                size={IconSizes.xl * 2} 
                color={Colors.gray[300]} 
              />
            </View>
            <Text style={styles.emptyText}>Aucun trajet trouvé</Text>
            <Text style={styles.emptySubtext}>
              Essayez avec d'autres villes ou réinitialisez la recherche
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleReset}
            >
              <Text style={styles.emptyButtonText}>Afficher tous les trajets</Text>
            </TouchableOpacity>
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
    backgroundColor: Colors.light.backgroundSecondary,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.gray[600],
  },
  
  // Header
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'] + 20,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  
  // Search Card
  searchCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  inputGroup: {
    marginBottom: Spacing.md,
  },
  
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
  },
  
  input: {
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.gray[900],
    backgroundColor: Colors.light.background,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  
  searchButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.md,
  },
  
  resetButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  
  buttonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  
  resetButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  
  // Results
  resultsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  
  resultsTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  resultsBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Empty State
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  
  emptyText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  
  emptySubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  
  emptyButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
});