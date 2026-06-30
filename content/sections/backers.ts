/**
 * Content data for the Backers section.
 *
 * Section copy for the build (dev-facing).
 */

// logoClass: per-logo OPTICAL balance (the uniform box equalizes bounding boxes, but each
// asset has different internal padding/weight, so tight wordmarks get scaled down a touch).
export const backers: Array<{
  name: string
  href: string
  logo?: string
  logoClass?: string
}> = [
  { name: "All in Bits", href: "https://allinbits.com/", logo: "/backers/all-in-bits.svg" },
  {
    name: "1Confirmation",
    href: "https://www.1confirmation.com/portfolio",
    logo: "/backers/1confirmation.webp",
  },
  {
    name: "Onbloc",
    href: "https://www.onbloc.xyz/",
    logo: "/backers/onbloc.avif",
    logoClass: "scale-90",
  },
]
