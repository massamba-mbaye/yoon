import { TripCard } from '@/components/TripCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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

  const handleViewPassengers = (tripId: string, departure: string, destination: string) => {
    router.push({
      pathname: '/trip-passengers',
      params: { id: tripId, departure, destination }
    });
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
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol 
            name="chevron.left" 
            size={IconSizes.md} 
            color={Colors.primary.main} 
          />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes trajets publiés</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol 
                name="car.fill" 
                size={IconSizes.xl * 2} 
                color={Colors.gray[300]} 
              />
            </View>
            <Text style={styles.emptyText}>Aucun trajet publié</Text>
            <Text style={styles.emptySubtext}>
              Publiez votre premier trajet pour commencer à partager vos voyages
            </Text>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="plus.circle.fill" 
                size={IconSizes.md} 
                color={Colors.light.background} 
              />
              <Text style={styles.publishButtonText}>Publier un trajet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tripsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <IconSymbol 
                  name="car.fill" 
                  size={IconSizes.lg} 
                  color={Colors.primary.main} 
                />
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{trips.length}</Text>
                  <Text style={styles.statLabel}>
                    Trajet{trips.length > 1 ? 's' : ''} publié{trips.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tripsList}>
              {trips.map(trip => (
                <View key={trip.id} style={styles.tripCardWrapper}>
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
                  
                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => handleViewPassengers(trip.id, trip.departure, trip.destination)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="person.fill" 
                        size={IconSizes.sm} 
                        color={Colors.primary.main} 
                      />
                      <Text style={styles.viewButtonText}>Passagers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteTrip(trip.id)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="xmark.circle.fill" 
                        size={IconSizes.sm} 
                        color={Colors.error} 
                      />
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
    backgroundColor: Colors.light.card,
    paddingTop: Spacing['2xl'] + 20,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  
  backBtnText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
  },
  
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing['3xl'],
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
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    paddingHorizontal: Spacing.lg,
  },
  
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  
  publishButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  
  // Trips Container
  tripsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  statContent: {
    flex: 1,
  },
  
  statNumber: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
    marginTop: -4,
  },
  
  // Trips List
  tripsList: {
    gap: Spacing.lg,
  },
  
  tripCardWrapper: {
    marginBottom: Spacing.sm,
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  
  viewButton: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary.main,
  },
  
  viewButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  
  deleteButton: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error,
  },
  
  deleteButtonText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
});