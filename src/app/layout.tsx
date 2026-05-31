import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Satch — Trade Your Art for Bitcoin",
  description: "Create drawings for 100 SATS and sell them at auction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <SessionProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
