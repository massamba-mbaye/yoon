import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { sendPushNotification } from '@/config/notifications'; // ✅ AJOUT IMPORT
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Trip {
  id: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverTripsCount: number;
}

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, [id]);

  const loadTripDetails = async () => {
    try {
      const tripDoc = await getDoc(doc(db, 'trips', id as string));
      if (tripDoc.exists()) {
        setTrip({
          id: tripDoc.id,
          ...tripDoc.data()
        } as Trip);
      }
    } catch (error) {
      console.error('Erreur chargement trajet:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du trajet');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour réserver');
      return;
    }

    const seats = parseInt(seatsToBook);
    if (isNaN(seats) || seats < 1 || seats > (trip?.availableSeats || 0)) {
      Alert.alert('Erreur', `Veuillez saisir un nombre entre 1 et ${trip?.availableSeats}`);
      return;
    }

    if (!trip) return;

    try {
      const q = query(
        collection(db, 'bookings'),
        where('tripId', '==', trip.id),
        where('passengerId', '==', user.uid)
      );
      const existingBookings = await getDocs(q);

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

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();

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

                // ✅ NOTIFICATIONS ACTIVÉES
                try {
                  console.log('🔍 Recherche du conducteur ID:', trip.driverId);
                  
                  const driverDoc = await getDoc(doc(db, 'users', trip.driverId));
                  const driverData = driverDoc.data();

                  console.log('👤 Données conducteur:', {
                    exists: driverDoc.exists(),
                    hasPushToken: !!driverData?.pushToken,
                    pushToken: driverData?.pushToken
                  });

                  if (driverData?.pushToken) {
                    console.log('📤 Envoi notification au conducteur...');
                    
                    const result = await sendPushNotification(
                      driverData.pushToken,
                      '🎉 Nouvelle réservation !',
                      `${userData?.name || 'Un passager'} a réservé ${seats} place(s) pour ${trip.departure} → ${trip.destination}`,
                      { 
                        screen: '/my-trips',
                        tripId: trip.id 
                      }
                    );
                    
                    console.log('✅ Notification envoyée, résultat:', result);
                  } else {
                    console.log('⚠️ Conducteur sans pushToken - notification non envoyée');
                  }
                } catch (notifError) {
                  console.error('❌ Erreur envoi notification:', notifError);
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
    } catch (error) {
      console.error('Erreur vérification réservation:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol 
          name="exclamationmark.triangle" 
          size={IconSizes.xl * 2} 
          color={Colors.error} 
        />
        <Text style={styles.errorText}>Trajet introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnTrip = auth.currentUser?.uid === trip.driverId;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <Text style={styles.headerTitle}>Détails du trajet</Text>
      </View>

      {/* Route Card */}
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <View style={styles.locationPoint}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.md} 
              color={Colors.primary.main} 
            />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.locationLabel}>Départ</Text>
            <Text style={styles.locationName}>{trip.departure}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routeHeader}>
          <View style={[styles.locationPoint, styles.destinationPoint]}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.md} 
              color={Colors.secondary.main} 
            />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.locationLabel}>Arrivée</Text>
            <Text style={styles.locationName}>{trip.destination}</Text>
          </View>
        </View>

        <View style={styles.priceTag}>
          <Text style={styles.priceAmount}>{trip.price}</Text>
          <Text style={styles.priceCurrency}>CFA / place</Text>
        </View>
      </View>

      {/* Trip Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations du trajet</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <IconSymbol 
                name="calendar" 
                size={IconSizes.md} 
                color={Colors.primary.main} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{trip.date}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <IconSymbol 
                name="clock.fill" 
                size={IconSizes.md} 
                color={Colors.primary.main} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Heure</Text>
              <Text style={styles.infoValue}>{trip.time}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <IconSymbol 
                name="chair.fill" 
                size={IconSizes.md} 
                color={trip.availableSeats > 0 ? Colors.secondary.main : Colors.error} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Places</Text>
              <Text style={[
                styles.infoValue,
                trip.availableSeats === 0 && styles.noSeatsText
              ]}>
                {trip.availableSeats} disponible{trip.availableSeats > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Driver Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conducteur</Text>
        
        <View style={styles.driverContainer}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {trip.driverName.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{trip.driverName}</Text>
            <View style={styles.driverStats}>
              <View style={styles.statBadge}>
                <IconSymbol 
                  name="star.fill" 
                  size={IconSizes.xs} 
                  color={Colors.accent.orange} 
                />
                <Text style={styles.statText}>{trip.driverRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statSeparator}>•</Text>
              <Text style={styles.statText}>
                {trip.driverTripsCount} trajet{trip.driverTripsCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {trip.driverRating >= 4.5 && (
            <View style={styles.verifiedBadge}>
              <IconSymbol 
                name="checkmark.seal.fill" 
                size={IconSizes.sm} 
                color={Colors.secondary.main} 
              />
            </View>
          )}
        </View>
      </View>

      {/* Booking Section */}
      {!isOwnTrip && trip.availableSeats > 0 && (
        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>Réserver des places</Text>
          
          <View style={styles.seatsSelector}>
            <Text style={styles.seatsLabel}>Nombre de places</Text>
            <View style={styles.seatsInputContainer}>
              <TouchableOpacity
                style={styles.seatsButton}
                onPress={() => {
                  const current = parseInt(seatsToBook) || 1;
                  if (current > 1) setSeatsToBook(String(current - 1));
                }}
              >
                <IconSymbol 
                  name="chevron.left" 
                  size={IconSizes.sm} 
                  color={Colors.primary.main} 
                />
              </TouchableOpacity>

              <TextInput
                style={styles.seatsInput}
                value={seatsToBook}
                onChangeText={setSeatsToBook}
                keyboardType="numeric"
                maxLength={1}
              />

              <TouchableOpacity
                style={styles.seatsButton}
                onPress={() => {
                  const current = parseInt(seatsToBook) || 1;
                  if (current < trip.availableSeats) setSeatsToBook(String(current + 1));
                }}
              >
                <IconSymbol 
                  name="chevron.right" 
                  size={IconSizes.sm} 
                  color={Colors.primary.main} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalValue}>
              {(parseInt(seatsToBook) || 0) * trip.price} CFA
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.bookButton, bookingLoading && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={bookingLoading}
            activeOpacity={0.7}
          >
            {bookingLoading ? (
              <ActivityIndicator color={Colors.light.background} />
            ) : (
              <View style={styles.bookButtonContent}>
                <IconSymbol 
                  name="checkmark.circle.fill" 
                  size={IconSizes.md} 
                  color={Colors.light.background} 
                />
                <Text style={styles.bookButtonText}>Confirmer la réservation</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isOwnTrip && (
        <View style={styles.ownTripCard}>
          <IconSymbol 
            name="info.circle.fill" 
            size={IconSizes.md} 
            color={Colors.info} 
          />
          <Text style={styles.ownTripText}>C'est votre trajet</Text>
        </View>
      )}

      {trip.availableSeats === 0 && !isOwnTrip && (
        <View style={styles.fullTripCard}>
          <IconSymbol 
            name="xmark.circle.fill" 
            size={IconSizes.md} 
            color={Colors.error} 
          />
          <Text style={styles.fullTripText}>Trajet complet</Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
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
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  
  errorText: {
    fontSize: Typography.sizes.xl,
    color: Colors.gray[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  
  backButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  
  backButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
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
  
  // Route Card
  routeCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  locationPoint: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  destinationPoint: {
    backgroundColor: Colors.secondary.light + '30',
  },
  
  routeInfo: {
    flex: 1,
  },
  
  locationLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[600],
    marginBottom: 2,
    fontWeight: Typography.fontWeights.medium,
  },
  
  locationName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
  },
  
  routeLine: {
    width: 2,
    height: 32,
    backgroundColor: Colors.gray[300],
    marginLeft: 23,
    marginVertical: Spacing.xs,
  },
  
  priceTag: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    alignItems: 'center',
  },
  
  priceAmount: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
  },
  
  priceCurrency: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
    marginTop: -4,
  },
  
  // Card
  card: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.md,
  },
  
  // Info Grid
  infoGrid: {
    gap: Spacing.md,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  infoContent: {
    flex: 1,
  },
  
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[600],
    marginBottom: 2,
    fontWeight: Typography.fontWeights.medium,
  },
  
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
  },
  
  noSeatsText: {
    color: Colors.error,
  },
  
  // Driver
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  driverAvatarText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.dark,
  },
  
  driverInfo: {
    flex: 1,
  },
  
  driverName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.xs / 2,
  },
  
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent.orange + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  
  statText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
  
  statSeparator: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[400],
  },
  
  verifiedBadge: {
    backgroundColor: Colors.secondary.light + '30',
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  
  // Booking
  bookingCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  bookingTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.md,
  },
  
  seatsSelector: {
    marginBottom: Spacing.md,
  },
  
  seatsLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  
  seatsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  
  seatsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  seatsInput: {
    width: 80,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
    textAlign: 'center',
  },
  
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  
  totalLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
  },
  
  totalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
  },
  
  bookButton: {
    backgroundColor: Colors.primary.main,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  
  bookButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  bookButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  
  // Own Trip / Full Trip
  ownTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.info + '20',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  
  ownTripText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.info,
  },
  
  fullTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '20',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  
  fullTripText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.error,
  },
  
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});