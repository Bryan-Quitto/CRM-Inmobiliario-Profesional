self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const notification = data.notification || {};
  const title = notification.title || 'Nueva Notificación';
  const options = {
    body: notification.body || '',
    icon: notification.icon || '/logo.png',
    data: notification.data || {}
  };

  if (notification.actions) {
    options.actions = notification.actions;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'marcar_completada') {
    const taskId = event.notification.data && event.notification.data.taskId;
    if (taskId) {
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if ('postMessage' in client) {
              client.postMessage({ type: 'COMPLETE_TASK', taskId: taskId });
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/?tarea=' + taskId + '&action=complete');
          }
        })
      );
    }
    return;
  }

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window client is available, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
