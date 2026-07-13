import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Locale-aware navigation helpers. Use these instead of next/link and next/navigation so links,
// redirects, and the language switch preserve (or intentionally change) the active locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
