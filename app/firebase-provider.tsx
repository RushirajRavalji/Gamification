'use client';

import { useEffect } from 'react';
import { app, analytics } from '@/lib/firebase/firebase';

// This component handles Firebase initialization
export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Any additional Firebase setup can be done here
    console.log('Firebase initialized successfully');
  }, []);

  return <>{children}</>;
} 