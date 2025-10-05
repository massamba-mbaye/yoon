import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      const q = query(
        collection(db, 'bookings'),
        where('passengerId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const bookingsData: Booking[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const bookingData = docSnapshot.data();
        
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
        <Text style={styles.headerTitle}>Mes réservations</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol 
                name="ticket.fill" 
                size={IconSizes.xl * 2} 
                color={Colors.gray[300]} 
              />
            </View>
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Recherchez un trajet et réservez votre place pour commencer
            </Text>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="magnifyingglass" 
                size={IconSizes.md} 
                color={Colors.light.background} 
              />
              <Text style={styles.searchButtonText}>Rechercher un trajet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <IconSymbol 
                  name="ticket.fill" 
                  size={IconSizes.lg} 
                  color={Colors.secondary.main} 
                />
                <View style={styles.statContent}>
                  <Text style={styles.statNumber}>{bookings.length}</Text>
                  <Text style={styles.statLabel}>
                    Réservation{bookings.length > 1 ? 's' : ''} active{bookings.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {bookings.map(booking => (
              booking.trip ? (
                <View key={booking.id} style={styles.bookingCard}>
                  {/* Route */}
                  <View style={styles.routeSection}>
                    <View style={styles.routeRow}>
                      <View style={styles.routeDot}>
                        <IconSymbol 
                          name="location.fill" 
                          size={IconSizes.sm} 
                          color={Colors.primary.main} 
                        />
                      </View>
                      <Text style={styles.cityText}>{booking.trip.departure}</Text>
                    </View>
                    
                    <View style={styles.routeLine} />
                    
                    <View style={styles.routeRow}>
                      <View style={[styles.routeDot, styles.destinationDot]}>
                        <IconSymbol 
                          name="location.fill" 
                          size={IconSizes.sm} 
                          color={Colors.secondary.main} 
                        />
                      </View>
                      <Text style={styles.cityText}>{booking.trip.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <IconSymbol 
                        name="calendar" 
                        size={IconSizes.sm} 
                        color={Colors.gray[600]} 
                      />
                      <Text style={styles.infoText}>{booking.trip.date}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <IconSymbol 
                        name="clock.fill" 
                        size={IconSizes.sm} 
                        color={Colors.gray[600]} 
                      />
                      <Text style={styles.infoText}>{booking.trip.time}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <IconSymbol 
                        name="chair.fill" 
                        size={IconSizes.sm} 
                        color={Colors.gray[600]} 
                      />
                      <Text style={styles.infoText}>
                        {booking.seatsBooked} place{booking.seatsBooked > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Driver & Price */}
                  <View style={styles.footer}>
                    <View style={styles.driverSection}>
                      <IconSymbol 
                        name="person.fill" 
                        size={IconSizes.sm} 
                        color={Colors.gray[600]} 
                      />
                      <Text style={styles.driverText}>{booking.trip.driverName}</Text>
                    </View>
                    
                    <Text style={styles.priceText}>{booking.totalPrice} CFA</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.detailsButton]}
                      onPress={() => handleViewTripDetails(booking.tripId)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="info.circle.fill" 
                        size={IconSizes.sm} 
                        color={Colors.primary.main} 
                      />
                      <Text style={styles.detailsButtonText}>Détails</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.shareButton]}
                      onPress={() => handleShareBooking(booking)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="square.and.arrow.up" 
                        size={IconSizes.sm} 
                        color={Colors.secondary.main} 
                      />
                      <Text style={styles.shareButtonText}>Partager</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelBooking(booking)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name="xmark.circle.fill" 
                        size={IconSizes.sm} 
                        color={Colors.error} 
                      />
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
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
  
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  
  searchButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  
  // Bookings Container
  bookingsContainer: {
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
  
  // Booking Card
  bookingCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  
  // Route Section
  routeSection: {
    marginBottom: Spacing.md,
  },
  
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  routeDot: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  destinationDot: {
    backgroundColor: Colors.secondary.light + '30',
  },
  
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginLeft: 15,
    marginVertical: Spacing.xs / 2,
  },
  
  cityText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.md,
  },
  
  // Info Section
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  driverText: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
  
  priceText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  
  detailsButton: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary.main,
  },
  
  detailsButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  
  shareButton: {
    backgroundColor: Colors.secondary.light + '20',
    borderColor: Colors.secondary.main,
  },
  
  shareButtonText: {
    color: Colors.secondary.main,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  
  cancelButton: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error,
  },
  
  cancelButtonText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
});