'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HelloWorld from '@/components/HelloWorld';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <HelloWorld />
      </main>
    </QueryClientProvider>
  );
}
