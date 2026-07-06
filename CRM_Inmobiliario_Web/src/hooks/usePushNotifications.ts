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
            // Verificar contra el backend si la suscripción sigue viva allí
            api.post('/agente/dispositivos/verificar', { endpoint: subscription.endpoint })
              .then(res => {
                if (res.data?.isValid) {
                  setIsSubscribed(true);
                } else {
                  // Zombie subscription detected! Auto-resync in background
                  setIsSubscribed(false);
                  subscription.unsubscribe().then(() => {
                    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                    if (vapidPublicKey) {
                      registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: vapidPublicKey
                      }).then(newSub => {
                        const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSub.getKey('p256dh')!))))
                          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                        const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSub.getKey('auth')!))))
                          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                        
                        api.post('/agente/dispositivos/suscribir', {
                          endpoint: newSub.endpoint,
                          p256dh,
                          auth,
                          userAgent: navigator.userAgent
                        }).then(() => {
                          setIsSubscribed(true);
                        }).catch(() => {});
                      }).catch(() => {});
                    }
                  });
                }
              })
              .catch(() => {
                // If API fails, assume it's subscribed to not break UI aggressively
                setIsSubscribed(true);
              });
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
    } catch {
      toast.error('Error al activar las notificaciones.');
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, isSubscribing]);

  const resyncPushSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      setIsSubscribing(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      
      // Request a new one directly by simulating the subscribeToPush without checking if isSubscribing since we're already handling it
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error('VAPID public key not found');

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSubscription.getKey('p256dh')!))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(newSubscription.getKey('auth')!))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const payload = {
        endpoint: newSubscription.endpoint,
        p256dh: p256dh,
        auth: auth,
        userAgent: navigator.userAgent
      };

      await api.post('/agente/dispositivos/suscribir', payload);
      setIsSubscribed(true);
      toast.success('Dispositivo sincronizado correctamente.');
    } catch {
      toast.error('Error al sincronizar el dispositivo.');
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported) return;
    try {
      setIsSubscribing(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.delete('/agente/dispositivos/desuscribir', { data: { endpoint } });
      }
      
      setIsSubscribed(false);
      toast.success('Notificaciones desactivadas en este dispositivo.');
    } catch {
      toast.error('Error al desactivar las notificaciones.');
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isSubscribing, subscribeToPush, resyncPushSubscription, unsubscribeFromPush };
};
