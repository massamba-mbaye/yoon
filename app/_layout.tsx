import { auth } from '@/config/firebase';
import { registerForPushNotificationsAsync } from '@/config/notifications';
import { AuthService } from '@/services/authService';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      setUser(user);
      setInitializing(false);

      // Enregistrer pour les notifications si connecté
      if (user) {
        await registerForPushNotificationsAsync(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  // Écouter les notifications
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
      const data = response.notification.request.content.data;
      if (data.screen) {
        router.push(data.screen as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const checkPinAndRedirect = async () => {
    const hasPin = await AuthService.hasPin();
    
    if (hasPin) {
      router.replace('/pin-entry' as any);
    } else {
      router.replace('/auth' as any);
    }
  };

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Vérifier si un PIN existe
      checkPinAndRedirect();
    } else if (user && !inAuthGroup && segments[0] !== 'trip-details' && segments[0] !== 'my-trips' && segments[0] !== 'my-bookings' && segments[0] !== 'trip-passengers' && segments[0] !== 'pin-setup' && segments[0] !== 'pin-entry') {
      router.replace('/(tabs)');
    }
  }, [user, segments, initializing]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      
      <Stack.Screen 
        name="pin-entry" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="pin-setup" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      
      <Stack.Screen 
        name="trip-details" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="my-bookings" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="my-trips" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="trip-passengers" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}