
'use client';

import { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  const AppleID: any;
}

export default function AppleLoginButton({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const { toast } = useToast();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isAppleReady, setIsAppleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectURI = `${API_BASE_URL}/api/auth/apple/callback`;
  
  useEffect(() => {
    if (!isScriptLoaded || !clientId) return;

    try {
      AppleID.auth.init({
        clientId: clientId,
        scope: 'name email',
        redirectURI: redirectURI,
        usePopup: true,
      });
      setIsAppleReady(true);
    } catch (error) {
      console.error('Error initializing AppleID', error);
      toast({
        variant: 'destructive',
        title: 'Apple Login Error',
        description: 'Could not initialize Apple Sign-In.',
      });
    }
  }, [isScriptLoaded, clientId, redirectURI, toast]);

  const handleSignIn = useCallback(async () => {
    if (!isAppleReady || isLoading) return;

    setIsLoading(true);
    try {
      const data = await AppleID.auth.signIn();
      const { code } = data.authorization;
      
      const response = await fetch(`${API_BASE_URL}/api/auth/apple/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange Apple authorization code.');
      }

      const result = await response.json();
      if (result.token) {
        onLoginSuccess(result.token);
      } else {
        throw new Error('Backend did not return a valid token.');
      }
    } catch (error: any) {
      if (error && error.error !== '1001' && error.message) {
        console.error('Apple Sign-In failed', error);
        toast({
          variant: 'destructive',
          title: 'Apple Login Failed',
          description: 'Could not sign in with Apple. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAppleReady, isLoading, onLoginSuccess, toast]);

  if (!clientId) {
    return <p className="text-destructive text-center text-xs">Apple Login is not configured correctly.</p>;
  }

  return (
    <>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load Apple Sign-In script.' })
        }}
      />
      <div style={{ width: '320px', height: '40px' }}>
        <Button 
            onClick={handleSignIn} 
            disabled={!isAppleReady || isLoading}
            variant="outline"
            className="w-full h-full bg-white text-black border-zinc-300 hover:bg-zinc-200 flex items-center justify-center gap-2"
        >
          {isLoading || !isAppleReady ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              <svg role="img" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                 <title>Apple</title>
                 <path fill="currentColor" d="M12.06,16.58c1.3,0,2.3-.81,3.02-1.62.28-.31.42-.68.51-1.07H19.5c0,.11,0,.22,0,.33,0,1.48-.48,2.83-1.3,3.95-.89,1.1-2.09,1.93-3.52,1.93-1.06,0-2.12-.51-2.91-1.23-.7-.62-1.25-1.52-1.52-2.61h3.93c.11,.43,.25,.83,.46,1.21,.42,.73,1.05,1.08,1.89,1.08M13.84,9.39c-.6-.78-1.54-.92-2.3-.92-.95,0-1.92,.4-2.61,1.15-.76,.81-1.3,2.02-1.3,3.19,0,.08,0,.17,0,.25h-3.9c0-2.22,1.21-4.14,3.16-5.31,1.23-.74,2.61-1.12,3.92-1.12,.4,0,.79,.05,1.17,.14a5.1,5.1,0,0,1,1.52-.14c1.3,0,2.54,.45,3.48,1.23-.31,.2-.62,.4-1.02,.62-.43,.25-.83,.48-1.12,.74Z"/>
              </svg>
              <span>Continue with Apple</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
