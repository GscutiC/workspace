'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserProfileForm from '@/components/UserProfileForm';

const queryClient = new QueryClient();

export default function ProfilePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-8">
        <SignedIn>
          <div className="container mx-auto px-4">
            <UserProfileForm />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800">Acceso Restringido</h1>
            <p className="text-gray-600 mt-2">
              Debes iniciar sesión para acceder a tu perfil.
            </p>
          </div>
        </SignedOut>
      </div>
    </QueryClientProvider>
  );
}