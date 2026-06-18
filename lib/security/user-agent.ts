import "server-only"

// Coarse, non-fingerprinting UA class for the audit log (e.g. "chrome-mobile").
export function classifyUserAgent(ua: string | null | undefined): string {
  if (!ua) {
    return "unknown"
  }
  if (/bot|crawler|spider|crawling/i.test(ua)) {
    return "bot"
  }
  const platform = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop"
  let family = "other"
  if (/Edg\//i.test(ua)) {
    family = "edge"
  } else if (/OPR\/|Opera/i.test(ua)) {
    family = "opera"
  } else if (/Firefox\//i.test(ua)) {
    family = "firefox"
  } else if (/Chrome\//i.test(ua)) {
    family = "chrome"
  } else if (/Safari\//i.test(ua)) {
    family = "safari"
  }
  return `${family}-${platform}`
}
