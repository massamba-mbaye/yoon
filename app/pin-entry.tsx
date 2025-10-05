import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { AuthService } from '@/services/authService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

export default function PinEntryScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [shakeAnimation, setShakeAnimation] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await AuthService.isBiometricAvailable();
    const enabled = await AuthService.isBiometricEnabled();
    
    if (available && enabled) {
      setBiometricAvailable(true);
      const type = await AuthService.getBiometricType();
      setBiometricType(type);
      
      // Proposer biométrie automatiquement
      handleBiometricLogin();
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    const result = await AuthService.loginWithBiometric();
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)' as any);
    } else if (result.error && result.error !== 'Authentification annulée') {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);

      // Vérifier le PIN quand 4 chiffres sont saisis
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (pinToVerify: string) => {
    setLoading(true);
    
    const result = await AuthService.loginWithPin(pinToVerify);
    
    if (result.success) {
      setLoading(false);
      router.replace('/(tabs)' as any);
    } else {
      setLoading(false);
      // Animation de secousse
      setShakeAnimation(true);
      Vibration.vibrate(400);
      setTimeout(() => {
        setShakeAnimation(false);
        setPin('');
      }, 500);
      
      Alert.alert('Erreur', 'PIN incorrect');
    }
  };

  const handleForgotPin = () => {
    router.push('/auth' as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <IconSymbol 
            name="car.fill" 
            size={IconSizes.xl * 2} 
            color={Colors.primary.main} 
          />
        </View>
        <Text style={styles.title}>Yoon</Text>
        <Text style={styles.subtitle}>Entrez votre code PIN</Text>
      </View>

      {/* PIN Dots */}
      <View style={[styles.dotsContainer, shakeAnimation && styles.shake]}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              pin.length > index && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {loading && (
        <ActivityIndicator 
          size="large" 
          color={Colors.primary.main} 
          style={styles.loader}
        />
      )}

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
          {/* Bouton biométrie */}
          {biometricAvailable ? (
            <TouchableOpacity
              style={styles.key}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="shield.fill" 
                size={IconSizes.lg} 
                color={Colors.primary.main} 
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.key} />
          )}

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

      {/* Forgot PIN */}
      <TouchableOpacity
        style={styles.forgotButton}
        onPress={handleForgotPin}
        activeOpacity={0.7}
      >
        <Text style={styles.forgotText}>PIN oublié ?</Text>
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
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.gray[600],
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
  
  loader: {
    marginVertical: Spacing.md,
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
  
  // Forgot Button
  forgotButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  
  forgotText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeights.semibold,
  },
});