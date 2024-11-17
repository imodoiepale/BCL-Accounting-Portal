// pages/api/auth/callback/google.tsx
'use client';  

import { useEffect } from 'react';

export default function GoogleCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      window.opener?.postMessage({ error }, window.location.origin);
      window.close();
      return;
    }

    if (code && state) {
      window.opener?.postMessage({ code, state }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">Completing authentication, please wait...</p>
    </div>
  );
}