const CACHE = 'vlsi-v1';
const ASSETS = [
  './vlsi-guide.html',
  './manifest.json'
];

// Install — cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'VLSI Study Time!', body: 'Time to study VLSI!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'vlsi-alarm',
      requireInteraction: true,
      actions: [
        { action: 'dismiss', title: 'Dismiss' },
        { action: 'snooze', title: 'Snooze 5 min' }
      ]
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'snooze') {
    // Post message to client to snooze
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SNOOZE' }));
    });
  } else {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length) return clients[0].focus();
        return self.clients.openWindow('./vlsi-guide.html');
      })
    );
  }
});

// Background alarm scheduler (checks every minute)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_ALARM') {
    const { label, time } = e.data;
    console.log('Alarm scheduled:', label, time);
  }
});
