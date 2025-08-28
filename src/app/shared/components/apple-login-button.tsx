
'use client';

import { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { Loader2 } from 'lucide-react';

declare global {
  const AppleID: any;
}

export default function AppleLoginButton({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const { toast } = useToast();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectURI = `${API_BASE_URL}/api/auth/apple/callback`;
  
  if (!clientId) {
    console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined.");
    return <p className="text-destructive text-sm">Apple Login is not configured.</p>;
  }

  useEffect(() => {
    if (!isScriptLoaded || !clientId) return;
    
    try {
      AppleID.auth.init({
        clientId: clientId,
        scope: 'name email',
        redirectURI: redirectURI,
        usePopup: true,
      });
      setIsInitializing(false);
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
    if (isInitializing) return;

    setIsLoading(true);
    try {
      const data = await AppleID.auth.signIn();
      const { code, state } = data.authorization;

      const response = await fetch(`${API_BASE_URL}/api/auth/apple/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          state: state || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange Apple authorization code.');
      }

      const result = await response.json();
      if (result.token) {
        onLoginSuccess(result.token);
      } else {
        throw new Error('Backend did not return a token.');
      }
    } catch (error: any) {
      // Don't show toast for user-cancelled sign in (error code 1001)
      if (error && error.error !== '1001') {
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
  }, [isInitializing, onLoginSuccess, toast]);

  return (
    <>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
       <div style={{ width: '320px', height: '40px' }}>
          {(isInitializing || isLoading) && (
             <div className="flex justify-center items-center w-full h-full bg-black rounded">
                <Loader2 className="h-5 w-5 animate-spin" />
             </div>
          )}
          <div
            id="appleid-signin"
            data-mode="sign-in"
            data-type="continue"
            data-color="black"
            data-border="true"
            data-border-radius="8"
            data-width="320"
            data-height="40"
            style={{ display: (isInitializing || isLoading) ? 'none' : 'block' }}
            onClick={handleSignIn}
          ></div>
      </div>
    </>
  );
}
