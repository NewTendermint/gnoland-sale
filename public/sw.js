// Web Push service worker. Shows the outbid / closing notification and focuses the sale on click.
// The payload is server-signed (VAPID) and carries no PII; the click target is forced same-origin.

// Activate a new version immediately so a fresh handler takes over without waiting for tabs to close.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = typeof data.title === "string" ? data.title : "GNOT Sale"
  const body = typeof data.body === "string" ? data.body : "Open the sale to check your bid."
  const path = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/"
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "gnot-bid",
      renotify: true,
      data: { path },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const path =
    typeof event.notification.data?.path === "string" ? event.notification.data.path : "/"
  const url = new URL(path, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const existing = wins.find((w) => w.url.startsWith(self.location.origin))
      if (existing) {
        existing.navigate(url)
        return existing.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
