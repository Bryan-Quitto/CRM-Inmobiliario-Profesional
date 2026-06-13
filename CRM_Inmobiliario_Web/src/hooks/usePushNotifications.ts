import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSupported] = useState('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);

  // Verificar suscripción existente al cargar
  useEffect(() => {
    if (isSupported && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, [isSupported]);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas en este navegador.');
      return;
    }

    if (isSubscribing) return;

    try {
      setIsSubscribing(true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permiso denegado para enviar notificaciones.');
        setIsSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const payload = {
        endpoint: subscription.endpoint,
        p256dh: p256dh,
        auth: auth,
        userAgent: navigator.userAgent
      };

      await api.post('/agente/dispositivos/suscribir', payload);
      setIsSubscribed(true);
      toast.success('Notificaciones activadas exitosamente.');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Error al activar las notificaciones.');
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, isSubscribing]);

  return { isSupported, isSubscribed, isSubscribing, subscribeToPush };
};
