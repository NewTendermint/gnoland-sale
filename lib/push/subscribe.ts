"use client"

export type PushOptInResult = "granted" | "denied" | "unsupported" | "error"

// Decode a url-safe base64 VAPID public key to the bytes PushManager.subscribe expects.
// Returns an ArrayBuffer-backed view so it is assignable to BufferSource (applicationServerKey).
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalized)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// The browser's current push subscription, or null (no SW / not subscribed / unsupported).
async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    return (await reg?.pushManager.getSubscription()) ?? null
  } catch {
    return null
  }
}

// Single place that POSTs a subscription + its bid limit to our route (used by opt-in + refresh).
function postSubscription(sub: PushSubscription, bidLimitUsd: number): Promise<Response> {
  return fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), bidLimitUsd }),
  })
}

export async function hasPushSubscription(): Promise<boolean> {
  return Boolean(await getActiveSubscription())
}

// Register the SW, request permission, subscribe, and POST the subscription. Never throws; the
// caller renders from the result. The native prompt only fires inside this call (on user click).
export async function enablePushAlerts(bidLimitUsd: number): Promise<PushOptInResult> {
  if (typeof window === "undefined") return "unsupported"
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported"
  }
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) return "unsupported"
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return "denied"
    const reg = await navigator.serviceWorker.register("/sw.js")
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
    if (!(await postSubscription(sub, bidLimitUsd)).ok) return "error"
    // Fire a confirmation so the user immediately sees whether OS notifications actually display
    // (there is no API to detect OS-level blocking; if they see nothing, the UI hint tells them).
    reg
      .showNotification("Outbid alerts on", {
        body: "We'll notify you here if you're outbid.",
        icon: "/icon-192x192.png",
      })
      .catch(() => {})
    return "granted"
  } catch {
    return "error"
  }
}

// Keep a live subscription's stored bid limit fresh when the bidder raises. No-op if not
// subscribed; best-effort (the cron's 410 cleanup and re-opt-in cover any miss).
export async function refreshPushLimit(bidLimitUsd: number): Promise<void> {
  const sub = await getActiveSubscription()
  if (!sub) return
  try {
    await postSubscription(sub, bidLimitUsd)
  } catch {
    // best-effort
  }
}
