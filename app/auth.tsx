import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth, db } from '@/config/firebase';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
    // NOUVEAU CODE
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      phone,
      rating: 0,
      tripsCount: 0,
      verified: false,
      createdAt: new Date().toISOString(),
    });

    // Rediriger vers la configuration du PIN
    router.replace({
      pathname: '/pin-setup' as any,
      params: { email, password }
    });

    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec illustration */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <IconSymbol 
              name="car.fill" 
              size={60} 
              color={Colors.primary.main} 
            />
          </View>
          
          <Text style={styles.title}>Yoon</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Bon retour !' : 'Bienvenue !'}
          </Text>
          <Text style={styles.description}>
            {isLogin 
              ? 'Connectez-vous pour voyager ensemble' 
              : 'Créez votre compte et commencez à partager vos trajets'}
          </Text>
        </View>

        {/* Sélecteur Login/Signup */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              Connexion
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <IconSymbol 
                  name="person.fill" 
                  size={IconSizes.sm} 
                  color={Colors.gray[600]} 
                />
                <Text style={styles.label}>Nom complet</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mamadou Diallo"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <IconSymbol 
                  name="phone.fill" 
                  size={IconSizes.sm} 
                  color={Colors.gray[600]} 
                />
                <Text style={styles.label}>Téléphone</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: +221 77 123 45 67"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <IconSymbol 
                name="envelope.fill" 
                size={IconSizes.sm} 
                color={Colors.gray[600]} 
              />
              <Text style={styles.label}>Email</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <IconSymbol 
                name="lock.fill" 
                size={IconSizes.sm} 
                color={Colors.gray[600]} 
              />
              <Text style={styles.label}>Mot de passe</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                placeholderTextColor={Colors.gray[400]}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <IconSymbol
                  name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  size={IconSizes.sm}
                  color={Colors.gray[500]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton principal */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.light.background} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                </Text>
                <IconSymbol 
                  name="arrow.right" 
                  size={IconSizes.sm} 
                  color={Colors.light.background} 
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Lien mot de passe oublié */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={IconSizes.md} 
                color={Colors.secondary.main} 
              />
            </View>
            <Text style={styles.featureText}>Voyages sécurisés</Text>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={IconSizes.md} 
                color={Colors.secondary.main} 
              />
            </View>
            <Text style={styles.featureText}>Prix économiques</Text>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={IconSizes.md} 
                color={Colors.secondary.main} 
              />
            </View>
            <Text style={styles.featureText}>Communauté vérifiée</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  
  title: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[900],
    marginBottom: Spacing.xs,
  },
  
  description: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    paddingHorizontal: Spacing.lg,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  
  activeTab: {
    backgroundColor: Colors.primary.main,
  },
  
  tabText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[600],
  },
  
  activeTabText: {
    color: Colors.light.background,
  },
  
  // Formulaire
  form: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  
  inputGroup: {
    marginBottom: Spacing.md,
  },
  
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.gray[700],
  },
  
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.gray[900],
    backgroundColor: Colors.light.background,
  },
  
  passwordInput: {
    paddingRight: 50,
  },
  
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    padding: Spacing.xs,
  },
  
  // Bouton
  button: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  
  buttonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  buttonText: {
    color: Colors.light.background,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },
  
  forgotPassword: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  
  forgotPasswordText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  
  // Features
  features: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  
  featureIcon: {
    marginRight: Spacing.sm,
  },
  
  featureText: {
    fontSize: Typography.sizes.base,
    color: Colors.gray[700],
    fontWeight: Typography.fontWeights.medium,
  },
});