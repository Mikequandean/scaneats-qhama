
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
          code: code,
          // The backend controller might expect 'codeForm' from a form post
          codeForm: code
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
                <path fill="currentColor" d="M12.15,2.56a5.21,5.21,0,0,0-4.33,2.64,5.36,5.36,0,0,0,1.3,7.5,4.3,4.3,0,0,0,4.88,1,4.52,4.52,0,0,0,3.37-4.27A6.47,6.47,0,0,0,12.15,2.56Zm2,7.39a3,3,0,0,1-1.28,2.37,3.12,3.12,0,0,1-2.48.3,3.8,3.8,0,0,1-2.22-3.3,3.33,3.33,0,0,1,1-2.48,2.94,2.94,0,0,1,2.38-.63,3.7,3.7,0,0,1,2.6,3.74Z"/>
                <path fill="currentColor" d="M17.46,6.3a4.73,4.73,0,0,1,1-2.43,4.64,4.64,0,0,0-3.9-2.31,5.29,5.29,0,0,0-4.48,2.83,5.07,5.07,0,0,0-1.21,4.3,4.1,4.1,0,0,0,3.5,2.69,1.16,1.16,0,0,0,1.21-.83,3.83,3.83,0,0,1-2.27-3.48,4.13,4.13,0,0,1,2.54-3.87,1,1,0,0,0,.68-1.25,1.2,1.2,0,0,0-.49-.78A3,3,0,0,1,17.46,6.3Z"/>
              </svg>
              Continue with Apple
            </>
          )}
        </Button>
      </div>
    </>
  );
}
