
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
  // This is the backend endpoint that will handle the code exchange.
  const redirectURI = `${API_BASE_URL}/api/auth/apple/callback`; 
  
  if (!clientId) {
    console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined.");
    return <p className="text-destructive text-sm">Apple Login is not configured.</p>;
  }

  // Initialize Apple Auth services once the script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !clientId) return;
    
    try {
      AppleID.auth.init({
        clientId: clientId,
        scope: 'name email',
        redirectURI: redirectURI, // This is for the backend, not a page redirect
        usePopup: true, // This is key for the sheet/popup flow
      });
      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing AppleID', error);
      toast({
          variant: 'destructive',
          title: 'Apple Login Error',
          description: 'Could not initialize Apple Sign-In.',
      });
       setIsInitializing(false);
    }

  }, [isScriptLoaded, clientId, redirectURI, toast]);

  const handleSignIn = useCallback(async () => {
    if (isInitializing || isLoading) return;

    setIsLoading(true);
    try {
      // This triggers the Apple Sign-In sheet
      const data = await AppleID.auth.signIn();
      const { code, state } = data.authorization;

      // The backend code expects a POST with form data
      const response = await fetch(`${API_BASE_URL}/api/auth/apple/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          state: state || '',
          // The backend controller has a bug where it expects a 'codeForm' from POST
          // so we send both 'code' and 'codeForm' to be safe.
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
        throw new Error('Backend did not return a token.');
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
  }, [isInitializing, isLoading, onLoginSuccess, toast]);

  return (
    <>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load Apple Sign-In script.'})
        }}
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
            style={{ display: (isInitializing || isLoading) ? 'none' : 'block', cursor: 'pointer' }}
            onClick={handleSignIn}
          ></div>
      </div>
    </>
  );
}
