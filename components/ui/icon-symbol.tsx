// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapping complet des SF Symbols vers Material Icons pour Android/Web
 */
const MAPPING = {
  // Navigation de base
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'magnifyingglass': 'search',
  'plus.circle.fill': 'add-circle',
  'person.fill': 'person',
  
  // Trajets et localisation
  'car.fill': 'directions-car',
  'location.fill': 'location-on',
  'calendar': 'calendar-today',
  'clock.fill': 'access-time',
  'chair.fill': 'event-seat',
  'star.fill': 'star',
  'arrow.right': 'arrow-forward',
  
  // Actions
  'square.and.arrow.up': 'share',
  'phone.fill': 'phone',
  'message.fill': 'message',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'envelope.fill': 'email',
  'lock.fill': 'lock',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  
  // Info et statut
  'info.circle.fill': 'info',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.triangle': 'warning',
  'checkmark.seal.fill': 'verified',
  
  // Navigation et interface
  'arrow.right.square.fill': 'exit-to-app',
  'pencil': 'edit',
  'bell.fill': 'notifications',
  'shield.fill': 'security',
  'ticket.fill': 'confirmation-number',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}