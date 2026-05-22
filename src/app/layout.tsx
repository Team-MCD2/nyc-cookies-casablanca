import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bebas_Neue, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { CookieNavigationLoader } from "@/components/cookie-navigation-loader";
import { SITE } from "@/lib/site";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.fullName} — Meilleurs cookies à Casablanca`,
    template: `%s — ${SITE.fullName}`,
  },
  description: SITE.description,
  keywords: [
    "cookies Casablanca",
    "NYC cookies",
    "cookies New York Casablanca",
    "meilleur cookie Casablanca",
    "livraison cookies Casablanca",
    "pâtisserie Casablanca",
    "cookies artisanaux",
    "boutique cookies Maroc",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.fullName,
    title: `${SITE.fullName} — L'Original NYC Cookie`,
    description: SITE.description,
    images: [{ url: "/images/hero.png", width: 1200, height: 630, alt: SITE.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.fullName,
    description: SITE.description,
    images: ["/images/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/nyclogo.png",
    apple: "/nyclogo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": SITE.fullName,
  "image": `${SITE.url}/images/hero.png`,
  "@id": SITE.url,
  "url": SITE.url,
  "telephone": SITE.phone,
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": SITE.address.street,
    "addressLocality": SITE.address.city,
    "addressCountry": "MA"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.5731, // Casablanca general
    "longitude": -7.5898
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "10:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "14:00",
      "closes": "22:00"
    }
  ],
  "sameAs": [
    SITE.social.instagram,
    SITE.social.facebook
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#d54a2a",
          colorBackground: "#141414",
          colorInputBackground: "#1c1c1c",
          colorInputText: "#fafafa",
          colorText: "#fafafa",
          colorTextSecondary: "#a3a3a3",
          colorNeutral: "#fafafa",
          fontFamily: '"Inter", system-ui, sans-serif',
          borderRadius: "10px",
        },
        elements: {
          // Embedded inline (no Clerk-hosted card around): no shadow, transparent
          card: "bg-transparent shadow-none border-0",
          rootBox: "w-full",
          // Force readable contrast on social buttons
          socialButtonsBlockButton:
            "border-border-strong bg-surface-2 text-text hover:bg-surface-3",
          socialButtonsBlockButtonText: "text-text font-medium",
          socialButtonsProviderIcon: "brightness-100",
          // Polish form inputs to match our design tokens
          formFieldInput:
            "bg-surface-2 border-border-strong text-text placeholder:text-text-muted",
          formFieldLabel: "text-text font-medium",
          formButtonPrimary:
            "bg-accent hover:bg-accent-hover text-white font-semibold normal-case tracking-normal",
          footerActionLink: "text-accent hover:text-accent-hover",
          identityPreviewEditButton: "text-accent",
        },
      }}
    >
      <html lang={SITE.lang} className={`${bebas.variable} ${inter.variable}`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-bg focus:px-4 focus:py-2 focus:text-cream"
          >
            Aller au contenu
          </a>
          <CookieNavigationLoader />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
