import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PublishScreen() {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [price, setPrice] = useState('');
  const [seats, setSeats] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handlePublish = async () => {
    if (!departure || !destination || !price || !seats) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const priceNum = parseFloat(price);
    const seatsNum = parseInt(seats);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre valide');
      return;
    }

    if (isNaN(seatsNum) || seatsNum <= 0 || seatsNum > 8) {
      Alert.alert('Erreur', 'Le nombre de places doit être entre 1 et 8');
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour publier un trajet');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'trips'), {
        departure: departure.trim(),
        destination: destination.trim(),
        date: formatDate(date),
        time: formatTime(time),
        price: priceNum,
        availableSeats: seatsNum,
        driverId: user.uid,
        driverName: userData?.name || 'Utilisateur',
        driverRating: userData?.rating || 0,
        driverTripsCount: userData?.tripsCount || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      setDeparture('');
      setDestination('');
      setDate(new Date());
      setTime(new Date());
      setPrice('');
      setSeats('');

      Alert.alert(
        'Succès', 
        'Votre trajet a été publié avec succès !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      Alert.alert('Erreur', 'Impossible de publier le trajet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol 
          name="plus.circle.fill" 
          size={IconSizes.xl} 
          color={Colors.primary.main} 
        />
        <Text style={styles.title}>Publier un trajet</Text>
        <Text style={styles.subtitle}>
          Partagez votre véhicule et économisez sur vos frais
        </Text>
      </View>
      
      {/* Formulaire */}
      <View style={styles.form}>
        {/* Départ */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.sm} 
              color={Colors.primary.main} 
            />
            <Text style={styles.label}>Ville de départ</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Dakar"
            placeholderTextColor={Colors.gray[400]}
            value={departure}
            onChangeText={setDeparture}
            editable={!loading}
          />
        </View>

        {/* Destination */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <IconSymbol 
              name="location.fill" 
              size={IconSizes.sm} 
              color={Colors.secondary.main} 
            />
            <Text style={styles.label}>Ville d'arrivée</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Thiès"
            placeholderTextColor={Colors.gray[400]}
            value={destination}
            onChangeText={setDestination}
            editable={!loading}
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <IconSymbol 
              name="calendar" 
              size={IconSizes.sm} 
              color={Colors.gray[700]} 
            />
            <Text style={styles.label}>Date du voyage</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(date)}
            </Text>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Heure */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <IconSymbol 
              name="clock.fill" 
              size={IconSizes.sm} 
              color={Colors.gray[700]} 
            />
            <Text style={styles.label}>Heure de départ</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
            disabled={loading}
          >
            <Text style={styles.dateButtonText}>
              {formatTime(time)}
            </Text>
            <IconSymbol 
              name="chevron.right" 
              size={IconSizes.sm} 
              color={Colors.gray[400]} 
            />
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              is24Hour={true}
            />
          )}
        </View>

        {/* Prix */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.priceIcon}>CFA</Text>
            <Text style={styles.label}>Prix par passager</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: 2500"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            editable={!loading}
          />
          <Text style={styles.hint}>
            Prix recommandé basé sur le carburant et les péages
          </Text>
        </View>

        {/* Places */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <IconSymbol 
              name="chair.fill" 
              size={IconSizes.sm} 
              color={Colors.gray[700]} 
            />
            <Text style={styles.label}>Nombre de places disponibles</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: 3"
            placeholderTextColor={Colors.gray[400]}
            keyboardType="numeric"
            value={seats}
            onChangeText={setSeats}
            editable={!loading}
            maxLength={1}
          />
          <Text style={styles.hint}>
            Maximum 8 places
          </Text>
        </View>

        {/* Bouton de publication */}
        <TouchableOpacity 
          style={[styles.publishButton, loading && styles.publishButtonDisabled]} 
          onPress={handlePublish}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={Colors.light.background} />
          ) : (
            <View style={styles.publishButtonContent}>
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={IconSizes.md} 
                color={Colors.light.background} 
              />
              <Text style={styles.publishButtonText}>Publier le trajet</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Information card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <IconSymbol 
            name="info.circle.fill" 
            size={IconSizes.md} 
            color={Colors.info} 
          />
          <Text style={styles.infoTitle}>Conseils pour publier</Text>
        </View>
        <Text style={styles.infoText}>
          • Soyez précis sur les horaires{'\n'}
          • Indiquez le point de rendez-vous{'\n'}
          • Répondez rapidement aux demandes{'\n'}
          • Soyez ponctuel et courtois
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
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
  
  // Form
  form: {
    backgroundColor: Colors.light.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
    flex: 1,
  },
  
  required: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.fontWeights.bold,
  },
  
  priceIcon: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[700],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
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
  
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.background,
  },
  
  dateButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[900],
    fontWeight: Typography.fontWeights.medium,
  },
  
  publishButton: {
    backgroundColor: Colors.primary.main,
    padding: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.lg,
  },
  
  publishButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  
  publishButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  publishButtonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.info + '10',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  
  infoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.info,
  },
  
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray[700],
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
  
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});