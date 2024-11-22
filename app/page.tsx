'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAdmin = user?.id === "user_2mVpEc1IkgxLg6BNIpKjWNz4Uhj";

  useEffect(() => {
    // Only redirect after Clerk has loaded the user data
    if (isLoaded) {
      if (isAdmin) {
        router.push('/admin');
      } else if (user) {
        router.push('/player');
      }
    }
  }, [isLoaded, isAdmin, user, router]);

  // Loading state while Clerk loads or during redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecting...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
