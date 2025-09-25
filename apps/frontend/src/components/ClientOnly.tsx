'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders children on the client side to prevent hydration mismatches
 */
export const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children, 
  fallback = <div className="flex items-center justify-center h-full w-full bg-gray-900 text-white">Loading...</div> 
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};