import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "HomeAtlas — Your world, reconstructed. Your belongings, remembered.",
    template: "%s · HomeAtlas"
  },
  description:
    "HomeAtlas turns photos and videos of your home into an interactive 3D environment and an intelligent, searchable inventory. Find anything, remember everything.",
  keywords: [
    "home inventory",
    "3D home scan",
    "spatial memory",
    "AI assistant",
    "moving inventory",
    "insurance inventory",
    "belongings",
    "home organization"
  ],
  openGraph: {
    type: "website",
    siteName: "HomeAtlas",
    title: "HomeAtlas — Your world, reconstructed.",
    description:
      "Scan your space. Discover your belongings. Let AI remember where everything lives.",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeAtlas — Your world, reconstructed.",
    description: "Your home, reimagined as a living digital world."
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#090B0D",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
