import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, IconSizes, Shadows, Spacing, Typography } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  const iconSize = size === 'small' ? IconSizes.sm : size === 'large' ? IconSizes.md : IconSizes.sm;
  const iconColor = variant === 'outline' || variant === 'secondary' 
    ? Colors.primary.main 
    : Colors.light.background;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? Colors.primary.main : Colors.light.background} 
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <IconSymbol name={icon} size={iconSize} color={iconColor} />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <IconSymbol name={icon} size={iconSize} color={iconColor} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  fullWidth: {
    width: '100%',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  // Variants
  primaryButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.md,
  },
  
  secondaryButton: {
    backgroundColor: Colors.gray[100],
  },
  
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  
  dangerButton: {
    backgroundColor: Colors.error,
    ...Shadows.md,
  },
  
  successButton: {
    backgroundColor: Colors.success,
    ...Shadows.md,
  },
  
  // Sizes
  smallButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  
  mediumButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  
  largeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Text
  text: {
    fontWeight: Typography.fontWeights.bold,
  },
  
  primaryText: {
    color: Colors.light.background,
  },
  
  secondaryText: {
    color: Colors.primary.main,
  },
  
  outlineText: {
    color: Colors.primary.main,
  },
  
  dangerText: {
    color: Colors.light.background,
  },
  
  successText: {
    color: Colors.light.background,
  },
  
  smallText: {
    fontSize: Typography.sizes.sm,
  },
  
  mediumText: {
    fontSize: Typography.sizes.base,
  },
  
  largeText: {
    fontSize: Typography.sizes.lg,
  },
});