import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserData {
  name: string;
  email: string;
  phone: string;
  rating: number;
  tripsCount: number;
  verified: boolean;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={IconSizes.xl} color={Colors.error} />
        <Text style={styles.errorText}>Impossible de charger le profil</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            {userData.verified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol 
                  name="checkmark.seal.fill" 
                  size={IconSizes.md} 
                  color={Colors.secondary.main} 
                />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>
      </View>

      {/* Statistiques */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <IconSymbol 
                name="star.fill" 
                size={IconSizes.lg} 
                color={Colors.accent.orange} 
              />
            </View>
            <Text style={styles.statNumber}>
              {userData.rating > 0 ? userData.rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <IconSymbol 
                name="car.fill" 
                size={IconSizes.lg} 
                color={Colors.primary.main} 
              />
            </View>
            <Text style={styles.statNumber}>{userData.tripsCount}</Text>
            <Text style={styles.statLabel}>
              Trajet{userData.tripsCount > 1 ? 's' : ''} réalisé{userData.tripsCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Informations personnelles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <IconSymbol 
                name="envelope.fill" 
                size={IconSizes.sm} 
                color={Colors.primary.main} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <IconSymbol 
                name="phone.fill" 
                size={IconSizes.sm} 
                color={Colors.secondary.main} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{userData.phone}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes activités</Text>
        
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/my-trips')}
          >
            <View style={styles.actionIconContainer}>
              <IconSymbol 
                name="car.fill" 
                size={IconSizes.md} 
                color={Colors.primary.main} 
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes trajets publiés</Text>
              <Text style={styles.actionSubtitle}>Gérer mes offres de covoiturage</Text>
            </View>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/my-bookings')}
          >
            <View style={styles.actionIconContainer}>
              <IconSymbol 
                name="ticket.fill" 
                size={IconSizes.md} 
                color={Colors.secondary.main} 
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes réservations</Text>
              <Text style={styles.actionSubtitle}>Consulter mes voyages réservés</Text>
            </View>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Paramètres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingIconContainer}>
              <IconSymbol 
                name="pencil" 
                size={IconSizes.sm} 
                color={Colors.gray[700]} 
              />
            </View>
            <Text style={styles.settingText}>Modifier le profil</Text>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingIconContainer}>
              <IconSymbol 
                name="bell.fill" 
                size={IconSizes.sm} 
                color={Colors.gray[700]} 
              />
            </View>
            <Text style={styles.settingText}>Notifications</Text>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingIconContainer}>
              <IconSymbol 
                name="shield.fill" 
                size={IconSizes.sm} 
                color={Colors.gray[700]} 
              />
            </View>
            <Text style={styles.settingText}>Confidentialité</Text>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton de déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <IconSymbol 
            name="arrow.right.square.fill" 
            size={IconSizes.md} 
            color={Colors.error} 
          />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Espace en bas */}
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
  },
  
  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
  
  // Header
  headerGradient: {
    backgroundColor: Colors.primary.main,
    paddingTop: Spacing['2xl'] + 20,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  
  headerContent: {
    alignItems: 'center',
  },
  
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.light.background,
    ...Shadows.xl,
  },
  
  avatarText: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.dark,
  },
  
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs / 2,
  },
  
  name: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.background,
    marginBottom: Spacing.xs / 2,
  },
  
  email: {
    fontSize: Typography.sizes.base,
    color: Colors.primary[100],
  },
  
  // Stats
  statsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.lg,
  },
  
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  
  statNumber: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.xs / 2,
  },
  
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: Spacing.md,
  },
  
  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.md,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
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
    color: Colors.gray[900],
    fontWeight: Typography.fontWeights.semibold,
  },
  
  infoDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.xs,
  },
  
  // Actions Card
  actionsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  actionContent: {
    flex: 1,
  },
  
  actionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  
  actionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[600],
  },
  
  actionDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.xs,
  },
  
  // Settings Card
  settingsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  settingText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.gray[900],
    fontWeight: Typography.fontWeights.medium,
  },
  
  settingDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.xs / 2,
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  
  logoutText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.error,
  },
  
  bottomSpacer: {
    height: Spacing.xl,
  },
});