import { IconSymbol } from '@/components/ui/icon-symbol';
import { db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  price: number;
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

      const tripDoc = await getDoc(doc(db, 'trips', id as string));
      if (tripDoc.exists()) {
        setTrip(tripDoc.data() as Trip);
      }

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
        <Text style={styles.headerTitle}>Passagers</Text>
        <Text style={styles.headerSubtitle}>
          {departure} → {destination}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Trip Info Card */}
        {trip && (
          <View style={styles.tripInfoCard}>
            <View style={styles.tripInfoRow}>
              <View style={styles.tripInfoItem}>
                <IconSymbol 
                  name="calendar" 
                  size={IconSizes.sm} 
                  color={Colors.gray[600]} 
                />
                <Text style={styles.tripInfoText}>{trip.date}</Text>
              </View>
              
              <View style={styles.tripInfoItem}>
                <IconSymbol 
                  name="clock.fill" 
                  size={IconSizes.sm} 
                  color={Colors.gray[600]} 
                />
                <Text style={styles.tripInfoText}>{trip.time}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <IconSymbol 
                name="person.fill" 
                size={IconSizes.lg} 
                color={Colors.primary.main} 
              />
            </View>
            <Text style={styles.statNumber}>{passengers.length}</Text>
            <Text style={styles.statLabel}>
              Passager{passengers.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <IconSymbol 
                name="chair.fill" 
                size={IconSizes.lg} 
                color={Colors.secondary.main} 
              />
            </View>
            <Text style={styles.statNumber}>{totalSeatsBooked}</Text>
            <Text style={styles.statLabel}>
              Place{totalSeatsBooked > 1 ? 's' : ''} réservée{totalSeatsBooked > 1 ? 's' : ''}
            </Text>
          </View>

          {trip && (
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <IconSymbol 
                  name="chair.fill" 
                  size={IconSizes.lg} 
                  color={Colors.accent.orange} 
                />
              </View>
              <Text style={styles.statNumber}>{trip.availableSeats}</Text>
              <Text style={styles.statLabel}>
                Restante{trip.availableSeats > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <IconSymbol 
              name="checkmark.circle.fill" 
              size={IconSizes.md} 
              color={Colors.secondary.main} 
            />
            <Text style={styles.revenueLabel}>Revenu total</Text>
          </View>
          <Text style={styles.revenueValue}>{totalRevenue} CFA</Text>
        </View>

        {/* Passengers List */}
        {passengers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol 
                name="person.fill" 
                size={IconSizes.xl * 2} 
                color={Colors.gray[300]} 
              />
            </View>
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Les passagers qui réserveront ce trajet apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.passengersSection}>
            <Text style={styles.sectionTitle}>
              Liste des passagers ({passengers.length})
            </Text>
            
            {passengers.map((passenger, index) => (
              <View key={passenger.id} style={styles.passengerCard}>
                {/* Header */}
                <View style={styles.passengerHeader}>
                  <View style={styles.passengerLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {passenger.passengerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>
                        {passenger.passengerName}
                      </Text>
                      <Text style={styles.passengerPhone}>
                        {passenger.passengerPhone}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{index + 1}</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.passengerDetails}>
                  <View style={styles.detailItem}>
                    <IconSymbol 
                      name="chair.fill" 
                      size={IconSizes.sm} 
                      color={Colors.gray[600]} 
                    />
                    <Text style={styles.detailLabel}>Places réservées</Text>
                    <Text style={styles.detailValue}>{passenger.seatsBooked}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.priceIcon}>CFA</Text>
                    <Text style={styles.detailLabel}>Montant payé</Text>
                    <Text style={styles.priceValue}>{passenger.totalPrice}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => handleCallPassenger(passenger.passengerPhone)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol 
                      name="phone.fill" 
                      size={IconSizes.sm} 
                      color={Colors.secondary.main} 
                    />
                    <Text style={styles.callButtonText}>Appeler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.smsButton]}
                    onPress={() => handleSMSPassenger(passenger.passengerPhone)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol 
                      name="message.fill" 
                      size={IconSizes.sm} 
                      color={Colors.primary.main} 
                    />
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
    marginBottom: Spacing.xs / 2,
  },
  
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[600],
    fontWeight: Typography.fontWeights.medium,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  
  // Trip Info Card
  tripInfoCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  tripInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  
  statNumber: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  
  // Revenue Card
  revenueCard: {
    backgroundColor: Colors.secondary.light + '20',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.secondary.main + '40',
    alignItems: 'center',
  },
  
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  
  revenueLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
  },
  
  revenueValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.secondary.main,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  
  // Passengers Section
  passengersSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.md,
  },
  
  // Passenger Card
  passengerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  passengerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  avatarText: {
    color: Colors.primary.dark,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
  },
  
  passengerInfo: {
    flex: 1,
  },
  
  passengerName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  
  passengerPhone: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
  },
  
  badge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.md,
  },
  
  badgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
  },
  
  // Passenger Details
  passengerDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  detailLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
    fontWeight: Typography.fontWeights.medium,
  },
  
  detailValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  priceIcon: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[700],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  
  priceValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.secondary.main,
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  
  callButton: {
    backgroundColor: Colors.secondary.light + '20',
    borderColor: Colors.secondary.main,
  },
  
  callButtonText: {
    color: Colors.secondary.main,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  
  smsButton: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary.main,
  },
  
  smsButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
});