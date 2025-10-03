import { auth, db } from '@/config/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PublishScreen() {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [seats, setSeats] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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

      // Récupérer les infos de l'utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      console.log('Données utilisateur:', userData);
      console.log('Nom qui sera utilisé:', userData?.name);

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
        'Votre trajet a été publié avec succès',
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Publier un trajet</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Départ *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ville de départ"
          value={departure}
          onChangeText={setDeparture}
          editable={!loading}
        />

        <Text style={styles.label}>Destination *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ville d'arrivée"
          value={destination}
          onChangeText={setDestination}
          editable={!loading}
        />

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {formatDate(date)}
          </Text>
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

        <Text style={styles.label}>Heure de départ *</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
          disabled={loading}
        >
          <Text style={styles.dateButtonText}>
            {formatTime(time)}
          </Text>
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

        <Text style={styles.label}>Prix par passager (CFA) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2500"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          editable={!loading}
        />

        <Text style={styles.label}>Nombre de places disponibles *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3"
          keyboardType="numeric"
          value={seats}
          onChangeText={setSeats}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Publication en cours...</Text>
          ) : (
            <Text style={styles.buttonText}>Publier le trajet</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>* Tous les champs sont obligatoires</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    margin: 20,
    borderRadius: 10,
    marginBottom: 40,
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
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a8d5ba',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});