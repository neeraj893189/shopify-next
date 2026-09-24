import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { getNavigation } from "@/lib/shopify/navigation";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shopify Storefront",
  description: "A Shopify-powered storefront.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navigation = await getNavigation();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header navigation={navigation} />
        {children}

           <ChatWidget />
      </body>
    </html>
  );
}
