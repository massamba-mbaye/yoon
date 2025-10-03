import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export async function registerForPushNotificationsAsync(userId: string) {
  // Ignorer sur web pour éviter l'erreur VAPID
  if (Platform.OS === 'web') {
    console.log('Les notifications push ne sont pas supportées sur web pour le moment');
    return;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission refusée pour les notifications');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);

    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          pushToken: token,
          lastTokenUpdate: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erreur sauvegarde token:', error);
      }
    }
  } else {
    console.log('Les notifications ne fonctionnent que sur un appareil physique');
  }

  return token;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Erreur envoi notification:', error);
  }
}