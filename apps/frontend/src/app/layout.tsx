import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mercado App",
  description: "Mercado application with Clerk authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="p-4 border-b bg-white shadow-sm">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                  Mercado
                </Link>
                <nav className="hidden md:flex gap-6">
                  <SignedIn>
                    <Link
                      href="/profile"
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Perfil
                    </Link>
                  </SignedIn>
                  <Link
                    href="/virtual-office"
                    className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                  >
                    🏢 Virtual Office
                  </Link>
                </nav>
              </div>
              <div className="flex gap-2 items-center">
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
