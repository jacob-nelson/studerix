self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Presence of a fetch handler is what makes the installed PWA eligible.
// Requests are left on the network; offline use is outside this prototype.
self.addEventListener("fetch", () => {});
