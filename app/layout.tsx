import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = localFont({
  variable: "--font-inter",
  src: [
    { path: "../public/fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Stock Pilot - Wholesale Management",
  description: "Stock Pilot — wholesale e-commerce platform for managing products and suppliers",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
