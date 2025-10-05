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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
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
      console.log('❌ Permission refusée pour les notifications');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '3a587985-e20c-44d1-b91a-347ef78a8429'
      })).data;
      
      console.log('✅ Push token généré:', token);
    } catch (error) {
      console.error('❌ Erreur génération token:', error);
      return;
    }

    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          pushToken: token,
          lastTokenUpdate: new Date().toISOString(),
        });
        console.log('✅ Token sauvegardé dans Firestore pour user:', userId);
      } catch (error) {
        console.error('❌ Erreur sauvegarde token:', error);
      }
    }
  } else {
    console.log('⚠️ Les notifications ne fonctionnent que sur un appareil physique');
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
    console.log('📤 Envoi notification vers:', expoPushToken);
    console.log('📤 Titre:', title);
    console.log('📤 Message:', body);
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('✅ Réponse serveur Expo:', result);
    
    if (result.data && result.data.status === 'error') {
      console.error('❌ Erreur Expo Push:', result.data.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    throw error;
  }
}