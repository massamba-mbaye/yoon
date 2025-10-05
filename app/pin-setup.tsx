import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { AuthService } from '@/services/authService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

export default function PinSetupScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [shakeAnimation, setShakeAnimation] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await AuthService.isBiometricAvailable();
    if (available) {
      setBiometricAvailable(true);
      const type = await AuthService.getBiometricType();
      setBiometricType(type);
    }
  };

  const handleNumberPress = (number: string) => {
    if (currentPin.length < 4) {
      const newPin = currentPin + number;
      setCurrentPin(newPin);

      // Quand 4 chiffres sont saisis
      if (newPin.length === 4) {
        handlePinComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    setCurrentPin(currentPin.slice(0, -1));
  };

  const handlePinComplete = (pin: string) => {
    if (step === 'create') {
      // Première saisie
      setFirstPin(pin);
      setStep('confirm');
      setCurrentPin('');
    } else {
      // Confirmation
      if (pin === firstPin) {
        // PIN confirmé, sauvegarder
        savePin(pin);
      } else {
        // Erreur : les PIN ne correspondent pas
        setShakeAnimation(true);
        Vibration.vibrate(400);
        setTimeout(() => {
          setShakeAnimation(false);
          setCurrentPin('');
        }, 500);
        Alert.alert(
          'Erreur',
          'Les codes PIN ne correspondent pas. Réessayez.',
          [
            {
              text: 'OK',
              onPress: () => {
                setStep('create');
                setFirstPin('');
              }
            }
          ]
        );
      }
    }
  };

  const savePin = async (pin: string) => {
    try {
      await AuthService.savePin(pin, email as string, password as string);
      
      // Proposer d'activer la biométrie
      if (biometricAvailable) {
        Alert.alert(
          'Activer ' + biometricType + ' ?',
          `Voulez-vous utiliser ${biometricType} pour une connexion encore plus rapide ?`,
          [
            {
              text: 'Non merci',
              style: 'cancel',
              onPress: () => finishSetup(),
            },
            {
              text: 'Activer',
              onPress: async () => {
                await AuthService.setBiometricEnabled(true);
                finishSetup();
              },
            },
          ]
        );
      } else {
        finishSetup();
      }
    } catch (error) {
      console.error('Erreur sauvegarde PIN:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le PIN');
    }
  };

  const finishSetup = () => {
    Alert.alert(
      'Succès',
      'Votre code PIN a été configuré avec succès !',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)' as any),
        },
      ]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Passer cette étape ?',
      'Vous devrez utiliser votre email et mot de passe pour vous connecter.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Passer',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)' as any),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <IconSymbol 
            name="lock.fill" 
            size={IconSizes.xl * 2} 
            color={Colors.primary.main} 
          />
        </View>
        <Text style={styles.title}>Configurez votre PIN</Text>
        <Text style={styles.subtitle}>
          {step === 'create' 
            ? 'Créez un code PIN à 4 chiffres' 
            : 'Confirmez votre code PIN'}
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressDot, step === 'confirm' && styles.progressDotActive]} />
      </View>

      {/* PIN Dots */}
      <View style={[styles.dotsContainer, shakeAnimation && styles.shake]}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPin.length > index && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        <View style={styles.row}>
          {['1', '2', '3'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          {['4', '5', '6'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          {['7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.key} />

          <TouchableOpacity
            style={styles.key}
            onPress={() => handleNumberPress('0')}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.key}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconSymbol 
              name="chevron.left" 
              size={IconSizes.lg} 
              color={Colors.gray[600]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Passer cette étape</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'space-between',
    paddingVertical: Spacing['3xl'],
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.xl,
  },
  
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[300],
  },
  
  progressDotActive: {
    backgroundColor: Colors.primary.main,
    width: 24,
  },
  
  // PIN Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing['2xl'],
  },
  
  dot: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    backgroundColor: 'transparent',
  },
  
  dotFilled: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  
  shake: {
    // Animation définie via transform dans le code si nécessaire
  },
  
  // Keypad
  keypad: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  
  key: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  
  keyText: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
  },
  
  // Skip Button
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  
  skipText: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[500],
    fontWeight: Typography.fontWeights.medium,
  },
});