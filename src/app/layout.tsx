import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/QueryProvider";
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
  title: "SHARKONE — Shop. Ship. Smile.",
  description: "SHARKONE is a multi-vendor marketplace connecting buyers, sellers, and delivery riders. Discover products, sell your goods, or earn as a delivery partner.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <QueryProvider>
          {children}
          <RolePickerModal />
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
