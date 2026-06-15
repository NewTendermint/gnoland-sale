/** Tailwind v4's lg breakpoint (--breakpoint-lg: 64rem) as a media-query string.
 * One source for the JS-side "desktop" gates (funnel capability, desktop-only
 * parallax, the mobile-menu auto-close). Media-query rem resolves against the
 * initial font size, the same basis Tailwind uses. */
export const LG_MEDIA_QUERY = "(min-width: 64rem)"
