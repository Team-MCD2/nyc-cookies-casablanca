import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bebas_Neue, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
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
    default: `${SITE.fullName} — Best cookies in town`,
    template: `%s — ${SITE.fullName}`,
  },
  description: SITE.description,
  keywords: [
    "cookies Casablanca",
    "NYC cookies",
    "cookies new-yorkais",
    "boulangerie Casablanca",
    "Maroc",
    "livraison cookies",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.fullName,
    title: SITE.fullName,
    description: SITE.description,
    images: [{ url: "/nyclogo.png", width: 512, height: 512, alt: SITE.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.fullName,
    description: SITE.description,
    images: ["/nyclogo.png"],
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
        <body>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-bg focus:px-4 focus:py-2 focus:text-cream"
          >
            Aller au contenu
          </a>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
