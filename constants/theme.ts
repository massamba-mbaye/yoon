/**
 * Yoon Design System
 * Système de design moderne pour l'application de covoiturage
 */

import { Platform } from 'react-native';

// Palette de couleurs principale inspirée du voyage et de la confiance
export const Colors = {
  // Couleurs principales
  primary: {
    main: '#2563EB', // Bleu profond moderne
    light: '#60A5FA',
    dark: '#1E40AF',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
  },
  
  secondary: {
    main: '#10B981', // Vert confiance/succès
    light: '#34D399',
    dark: '#059669',
  },
  
  // Couleurs d'accentuation
  accent: {
    orange: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
  },
  
  // Couleurs fonctionnelles
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Nuances de gris
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Thèmes clair/sombre
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  dark: {
    background: '#111827',
    backgroundSecondary: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    card: '#1F2937',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Typographie
export const Typography = {
  fontFamily: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
    },
    default: {
      regular: 'system-ui',
      medium: 'system-ui',
      semiBold: 'system-ui',
      bold: 'system-ui',
    },
  }),
  
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Espacements
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Bordures
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Ombres
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animations
export const Animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Icônes SF Symbols pour remplacer les émojis
export const Icons = {
  // Navigation
  search: 'magnifyingglass',
  add: 'plus.circle.fill',
  profile: 'person.fill',
  back: 'chevron.left',
  
  // Trajets
  car: 'car.fill',
  location: 'location.fill',
  calendar: 'calendar',
  clock: 'clock.fill',
  seat: 'chair.fill',
  star: 'star.fill',
  
  // Actions
  share: 'square.and.arrow.up',
  phone: 'phone.fill',
  message: 'message.fill',
  checkmark: 'checkmark.circle.fill',
  xmark: 'xmark.circle.fill',
  
  // Info
  info: 'info.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  verified: 'checkmark.seal.fill',
};

// Tailles d'icônes standardisées
export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

// Export d'un thème par défaut
export const DefaultTheme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animations: Animations,
  icons: Icons,
  iconSizes: IconSizes,
};

export type Theme = typeof DefaultTheme;