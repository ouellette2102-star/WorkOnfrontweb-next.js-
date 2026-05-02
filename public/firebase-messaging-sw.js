/* Firebase Cloud Messaging service worker.
 *
 * The Firebase Web SDK requires this file to live at the *origin
 * root* (`/firebase-messaging-sw.js`) so the browser can register
 * it. Next.js serves anything in /public/ at the origin root, which
 * is why this file lives outside src/.
 *
 * Config values are duplicated from src/lib/firebase-client.ts —
 * service workers run in a separate global without access to the
 * Next.js env injection. Keep the two in sync.
 *
 * Compat builds are used because workers don't support modular
 * imports without bundling, and Firebase publishes ready-to-go
 * compat scripts on gstatic.
 */

self.importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
self.importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

// Read config from URL search params attached at registration time
// in firebase-client.ts. Falls back to a no-op if missing so the
// worker never crashes on a vanilla install.
const params = new URL(self.location).searchParams;
const config = {
  apiKey: params.get("apiKey") || self.__FIREBASE_CONFIG__?.apiKey,
  authDomain: params.get("authDomain") || self.__FIREBASE_CONFIG__?.authDomain,
  projectId: params.get("projectId") || self.__FIREBASE_CONFIG__?.projectId,
  messagingSenderId:
    params.get("messagingSenderId") || self.__FIREBASE_CONFIG__?.messagingSenderId,
  appId: params.get("appId") || self.__FIREBASE_CONFIG__?.appId,
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  // eslint-disable-next-line no-undef
  firebase.initializeApp(config);
  // eslint-disable-next-line no-undef
  const messaging = firebase.messaging();

  // Background notifications — fired when the tab is closed or the
  // browser is in the background. Foreground messages go through
  // onForegroundMessage in firebase-client.ts.
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "WorkOn";
    const body = payload.notification?.body || "";
    const data = payload.data || {};
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data,
    });
  });

  // Click on the system notification → focus / open the deep-link.
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.actionUrl || "/";
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin)) {
              client.navigate(url);
              return client.focus();
            }
          }
          return self.clients.openWindow(url);
        }),
    );
  });
}
