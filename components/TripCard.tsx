import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Driver {
  name: string;
  rating: number;
  tripsCount: number;
}

interface Trip {
  id: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  driver: Driver;
}

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* En-tête avec itinéraire et prix */}
      <View style={styles.header}>
        <View style={styles.routeContainer}>
          <View style={styles.locationBadge}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.xs} 
              color={Colors.primary.main} 
            />
            <Text style={styles.cityText}>{trip.departure}</Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <IconSymbol 
              name="arrow.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </View>
          
          <View style={styles.locationBadge}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.xs} 
              color={Colors.secondary.main} 
            />
            <Text style={styles.cityText}>{trip.destination}</Text>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceAmount}>{trip.price}</Text>
          <Text style={styles.priceCurrency}>CFA</Text>
        </View>
      </View>

      {/* Séparateur */}
      <View style={styles.divider} />

      {/* Détails du trajet */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <IconSymbol 
            name="calendar" 
            size={IconSizes.sm} 
            color={Colors.gray[600]} 
          />
          <Text style={styles.detailText}>{trip.date}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <IconSymbol 
            name="clock.fill" 
            size={IconSizes.sm} 
            color={Colors.gray[600]} 
          />
          <Text style={styles.detailText}>{trip.time}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <IconSymbol 
            name="chair.fill" 
            size={IconSizes.sm} 
            color={trip.availableSeats > 0 ? Colors.secondary.main : Colors.error} 
          />
          <Text style={[
            styles.detailText,
            trip.availableSeats === 0 && styles.noSeatsText
          ]}>
            {trip.availableSeats} {trip.availableSeats > 1 ? 'places' : 'place'}
          </Text>
        </View>
      </View>

      {/* Séparateur */}
      <View style={styles.divider} />

      {/* Informations conducteur */}
      <View style={styles.footer}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {trip.driver.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName} numberOfLines={1}>
              {trip.driver.name}
            </Text>
            
            <View style={styles.driverStats}>
              <View style={styles.statItem}>
                <IconSymbol 
                  name="star.fill" 
                  size={IconSizes.xs} 
                  color={Colors.accent.orange} 
                />
                <Text style={styles.statText}>
                  {trip.driver.rating.toFixed(1)}
                </Text>
              </View>
              
              <Text style={styles.statSeparator}>•</Text>
              
              <Text style={styles.statText}>
                {trip.driver.tripsCount} trajet{trip.driver.tripsCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Badge de disponibilité */}
        {trip.availableSeats === 0 ? (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>Complet</Text>
          </View>
        ) : (
          <View style={styles.availableBadge}>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.primary.main} 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.md,
  },
  
  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: Spacing.sm,
  },
  
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  
  cityText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
  },
  
  arrowContainer: {
    marginHorizontal: Spacing.xs,
  },
  
  priceContainer: {
    alignItems: 'flex-end',
  },
  
  priceAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
  },
  
  priceCurrency: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.gray[600],
    marginTop: -4,
  },
  
  // Séparateur
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.sm,
  },
  
  // Détails
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  detailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
  
  noSeatsText: {
    color: Colors.error,
  },
  
  // Footer conducteur
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  
  avatarText: {
    color: Colors.primary.dark,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  
  driverDetails: {
    flex: 1,
  },
  
  driverName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  
  statText: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[600],
    fontWeight: Typography.fontWeights.medium,
  },
  
  statSeparator: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[400],
  },
  
  // Badges de disponibilité
  fullBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  
  fullBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[600],
  },
  
  availableBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});