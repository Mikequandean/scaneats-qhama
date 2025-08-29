
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
  
  // This initialization runs once after the script has loaded.
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
      // Don't show toast for user-cancelled sign in (error code 1001)
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
            className="w-full h-full bg-black text-white border-white/40 hover:bg-zinc-800 hover:text-white"
        >
          {isLoading || !isAppleReady ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              <svg role="img" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <title>Apple</title>
                <path fill="currentColor" d="M12.003 17.03c1.946 0 3.21-1.21 4.25-2.42a1 1 0 00.08-1.52c-.17-.18-.36-.26-.54-.26-.74 0-1.4.45-2.2.45-.88 0-1.6-.48-2.28-.48-.77 0-1.58.48-2.33.48-.74 0-1.4-.45-2.2-.45-.88 0-1.6.48-2.28.48-.55 0-1.3-.3-1.88-.3-.22 0-.43.08-.6.26a1 1 0 00.08 1.52c1.04 1.21 2.3 2.42 4.25 2.42Zm2.25-7.03c.03-.63.08-1.26.1-1.88-.93.06-2.06.6-2.73 1.44-.6.72-.98 1.62-1.01 2.52.88-.03 1.94-.57 2.62-1.38.48-.6.8-1.44.9-2.2.1-1.04.03-2.11-.08-3.15-.88.06-1.97.6-2.65 1.38-.69.8-1.13 1.83-1.04 2.82.02.22.05.43.08.63.85-.03 1.94-.57 2.62-1.38.6-.72 1.01-1.62 1.04-2.52a6.56 6.56 0 01.18-2.11c-.93.03-2.03.54-2.7 1.35-.69.8-1.13 1.83-1.04 2.82a15.8 15.8 0 00.1 1.62c.9-.03 2.03-.57 2.7-1.38.45-.54.83-1.35 1.01-2.23a10.4 10.4 0 01.1-2.05c-1.24.03-2.5.6-3.27 1.47-.8.87-1.32 2.06-1.2 3.24.03.3.1.6.15.9.08.3.18.6.3.87a4.33 4.33 0 003.52 2.14c.23 0 .46-.02.69-.05.2-.03.4-.06.6-.12a4.4 4.4 0 002.2-1.24c.03-.03.06-.06.08-.1a1 1 0 00-1.12-1.64c-.04.04-.08.08-.12.11a2.4 2.4 0 01-1.2.65c-.14.03-.28.05-.42.05-.93 0-1.7-.5-2.02-1.27a.8.8 0 01.02-.75Z"/>
              </svg>
              Continue with Apple
            </>
          )}
        </Button>
      </div>
    </>
  );
}
