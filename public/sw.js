self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Deliberately no caching: BigPoker only makes sense online (live rooms over
// SSE), so every request goes straight to the network. This handler exists
// purely so browsers consider the app installable.
self.addEventListener("fetch", () => {});
