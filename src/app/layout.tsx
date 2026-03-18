import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00ff88' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
};

export const metadata: Metadata = {
  title: "Slither.io - Juego de Serpientes",
  description: "¡El mejor juego de serpientes! Crece comiendo orbes, elimina a tus oponentes y conviértete en la serpiente más grande del mapa.",
  keywords: ["slither.io", "game", "snake", "serpiente", "multijugador", "arcade", "casual", "móvil"],
  authors: [{ name: "Slither Game" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-512x512.png",
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Slither.io",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Slither.io - Juego de Serpientes",
    description: "¡Crece, compite y domina! El mejor juego de serpientes para móvil.",
    type: "website",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Slither.io Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Slither.io - Juego de Serpientes",
    description: "¡Crece, compite y domina! El mejor juego de serpientes para móvil.",
    images: ["/icons/icon-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-white overflow-hidden touch-none`}
        style={{ touchAction: 'none' }}
      >
        {children}
      </body>
    </html>
  );
}
