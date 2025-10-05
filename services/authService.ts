import { auth } from '@/config/firebase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { signInWithEmailAndPassword } from 'firebase/auth';

const PIN_KEY = 'user_pin';
const EMAIL_KEY = 'user_email';
const PASSWORD_KEY = 'user_password';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Service d'authentification avec PIN et biométrie
 */
export const AuthService = {
  /**
   * Vérifie si la biométrie est disponible sur l'appareil
   */
  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  /**
   * Obtient le type de biométrie disponible
   */
  async getBiometricType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Empreinte digitale';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    
    return 'Biométrie';
  },

  /**
   * Authentification avec biométrie
   */
  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentification pour Yoon',
        fallbackLabel: 'Utiliser le PIN',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Erreur authentification biométrique:', error);
      return false;
    }
  },

  /**
   * Sauvegarde le PIN de manière sécurisée
   */
  async savePin(pin: string, email: string, password: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    await SecureStore.setItemAsync(EMAIL_KEY, email);
    await SecureStore.setItemAsync(PASSWORD_KEY, password);
  },

  /**
   * Vérifie si un PIN existe
   */
  async hasPin(): Promise<boolean> {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return pin !== null;
  },

  /**
   * Vérifie si le PIN est correct
   */
  async verifyPin(pin: string): Promise<boolean> {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    return savedPin === pin;
  },

  /**
   * Connexion avec le PIN
   */
  async loginWithPin(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isValid = await this.verifyPin(pin);
      
      if (!isValid) {
        return { success: false, error: 'PIN incorrect' };
      }

      // Récupérer les credentials sauvegardés
      const email = await SecureStore.getItemAsync(EMAIL_KEY);
      const password = await SecureStore.getItemAsync(PASSWORD_KEY);

      if (!email || !password) {
        return { success: false, error: 'Credentials non trouvés' };
      }

      // Connexion Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur login PIN:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Connexion avec biométrie
   */
  async loginWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const authenticated = await this.authenticateWithBiometric();
      
      if (!authenticated) {
        return { success: false, error: 'Authentification annulée' };
      }

      // Récupérer les credentials sauvegardés
      const email = await SecureStore.getItemAsync(EMAIL_KEY);
      const password = await SecureStore.getItemAsync(PASSWORD_KEY);

      if (!email || !password) {
        return { success: false, error: 'Credentials non trouvés' };
      }

      // Connexion Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur login biométrique:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Active/Désactive la biométrie
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
  },

  /**
   * Vérifie si la biométrie est activée
   */
  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  },

  /**
   * Supprime toutes les données d'authentification
   */
  async clearAuthData(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  },

  /**
   * Réinitialise le PIN (nécessite email/mot de passe)
   */
  async resetPin(email: string, password: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier les credentials avec Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Sauvegarder le nouveau PIN
      await this.savePin(newPin, email, password);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur reset PIN:', error);
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }
  },
};