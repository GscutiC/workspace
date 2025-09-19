'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import HelloWorld from '@/components/HelloWorld';
import Link from 'next/link';

const queryClient = new QueryClient();

function AuthenticatedContent() {
  const { user } = useUser();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.firstName}!</h2>
      <p className="text-gray-600 mb-8">Has iniciado sesión correctamente en Mercado.</p>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4 justify-center">
          <Link
            href="/profile"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Completar Perfil
          </Link>
          <Link
            href="/virtual-office"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            🏢 Virtual Office
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Explora nuestro espacio de oficina virtual con avatares, chat y navegación interactiva
        </p>
      </div>

      <HelloWorld />
    </div>
  );
}

function UnauthenticatedContent() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Bienvenido a Mercado</h2>
      <p className="text-gray-600 mb-8">
        Inicia sesión o regístrate para acceder a todas las funcionalidades.
      </p>

      <div className="mb-6">
        <Link
          href="/virtual-office"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          🏢 Probar Virtual Office
        </Link>
        <p className="text-sm text-gray-500 mt-2">
          Demo de nuestro espacio de oficina virtual interactivo
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <SignedIn>
          <AuthenticatedContent />
        </SignedIn>
        <SignedOut>
          <UnauthenticatedContent />
        </SignedOut>
      </main>
    </QueryClientProvider>
  );
}
