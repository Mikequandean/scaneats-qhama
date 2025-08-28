
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AppleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.opener) {
      const token = searchParams.get('token');
      if (token) {
        // Send a message to the parent window with the token
        window.opener.postMessage({ type: 'apple-auth-success', token: token }, window.location.origin);
      } else {
        // Handle error case if needed
         window.opener.postMessage({ type: 'apple-auth-error', error: 'Token not found' }, window.location.origin);
      }
      // Close the popup window
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Authenticating, please wait...</p>
    </div>
  );
}


export default function AppleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <AppleCallbackContent />
        </Suspense>
    )
}
