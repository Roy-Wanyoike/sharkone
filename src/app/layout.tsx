import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/QueryProvider";
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd';
import { RolePickerModal } from "@/components/auth/RolePickerModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'SHARKONE — Shop. Ship. Smile.',
    template: '%s | SHARKONE',
  },
  description:
    "East Africa's premier e-commerce platform. Shop electronics, fashion, and more with fast delivery across Kenya.",
  keywords:     'SHARKONE, online shopping Kenya, e-commerce East Africa, electronics, fashion, marketplace, fast delivery',
  icons: {
    icon: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg',
  },
  metadataBase: new URL('https://sharkone.com'),
  openGraph: {
    type: 'website',
    title: 'SHARKONE — Shop. Ship. Smile.',
    description:
      "East Africa's premier e-commerce platform. Shop electronics, fashion, and more with fast delivery across Kenya.",
    siteName: 'SHARKONE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SHARKONE — East Africa\'s Premier E-Commerce Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SHARKONE — Shop. Ship. Smile.',
    description:
      "East Africa's premier e-commerce platform. Shop electronics, fashion, and more with fast delivery across Kenya.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#F59E0B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <div id="main-content">
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <QueryProvider>
          {children}
          <RolePickerModal />
          <Toaster position="top-right" richColors />
        </QueryProvider>
        </div>
      </body>
    </html>
  );
}
