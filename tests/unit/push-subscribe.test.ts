import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { enablePushAlerts } from "../../lib/push/subscribe"

// Spec-faithful SW mock: pushManager.subscribe rejects with InvalidStateError while the
// registration has no active worker (Push API, subscribe() step 11.3.2), which is Chrome's
// behavior right after register() on a first visit. `ready` resolves once activation lands.
function makeServiceWorkerEnv() {
  const registration = {
    active: null as object | null,
    pushManager: {
      subscribe: vi.fn(async () => {
        if (!registration.active) {
          throw new DOMException("no active Service Worker", "InvalidStateError")
        }
        return { toJSON: () => ({ endpoint: "https://push.example.test/sub" }) }
      }),
      getSubscription: vi.fn(async () => null),
    },
    showNotification: vi.fn(async () => {}),
  }
  const serviceWorker = {
    register: vi.fn(async () => registration),
    getRegistration: vi.fn(async () => registration),
    // Activation is observable only through `ready`: code that never awaits it keeps
    // seeing a registration with no active worker, like a real first visit.
    get ready() {
      registration.active = { state: "activated" }
      return Promise.resolve(registration)
    },
  }
  return { registration, serviceWorker }
}

describe("enablePushAlerts", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "aGVsbG8")
    vi.stubGlobal("PushManager", class {})
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn(async () => "granted"),
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("subscribes only once the service worker is active (first visit, fresh registration)", async () => {
    const { registration, serviceWorker } = makeServiceWorkerEnv()
    Object.defineProperty(navigator, "serviceWorker", {
      value: serviceWorker,
      configurable: true,
    })

    const result = await enablePushAlerts(500)

    expect(result).toBe("granted")
    expect(registration.pushManager.subscribe).toHaveBeenCalledTimes(1)
  })
})
