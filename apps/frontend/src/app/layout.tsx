'use client';

import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useState } from "react";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ClerkProvider>
      <html lang="en">
        <head></head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="flex h-screen w-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <nav className={`
              ${sidebarCollapsed ? 'w-16' : 'w-64'} 
              bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out relative
            `}>
              {/* Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute -right-3 top-6 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
                title={sidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              >
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo/Brand */}
              <div className="p-6 border-b border-gray-700">
                <Link href="/" className={`text-2xl font-bold text-white hover:text-indigo-400 transition-colors ${sidebarCollapsed ? 'text-center' : ''}`} suppressHydrationWarning translate="no">
                  {sidebarCollapsed ? 'M' : 'Mercado'}
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-4 py-6 space-y-2">
                <SignedIn>
                  <Link
                    href="/"
                    className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title="Inicio"
                  >
                    <span>🏠</span>
                    {!sidebarCollapsed && <span>Inicio</span>}
                  </Link>
                  
                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title="Perfil"
                  >
                    <span>👤</span>
                    {!sidebarCollapsed && <span>Perfil</span>}
                  </Link>
                  
                  <Link
                    href="/virtual-office"
                    className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors font-medium ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title="Virtual Office"
                  >
                    <span>🏢</span>
                    {!sidebarCollapsed && <span>Virtual Office</span>}
                  </Link>

                  <Link
                    href="/virtual-office/lobby"
                    className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center ml-0' : 'ml-4'}`}
                    title="Lobby / Personalizar"
                  >
                    <span>🎨</span>
                    {!sidebarCollapsed && <span>Lobby / Personalizar</span>}
                  </Link>
                </SignedIn>

                <SignedOut>
                  {!sidebarCollapsed && (
                    <div className="px-4 py-3 text-gray-400 text-sm">
                      Inicia sesión para acceder a todas las funciones
                    </div>
                  )}
                </SignedOut>
              </div>

              {/* User Area */}
              <div className="p-4 border-t border-gray-700">
                <SignedOut>
                  {!sidebarCollapsed ? (
                    <div className="space-y-2">
                      <SignInButton>
                        <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          Iniciar Sesión
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <button className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                          Registrarse
                        </button>
                      </SignUpButton>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <SignInButton>
                        <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" title="Iniciar Sesión">
                          👤
                        </button>
                      </SignInButton>
                    </div>
                  )}
                </SignedOut>
                <SignedIn>
                  <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                    <UserButton />
                    {!sidebarCollapsed && <span className="text-sm text-gray-300">Mi Cuenta</span>}
                  </div>
                </SignedIn>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden">
              <QueryProvider>
                {children}
              </QueryProvider>
            </main>
          </div>

          {/* Async script for parcel testing functions */}
          <Script
            src="/parcel-test-functions.js"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
