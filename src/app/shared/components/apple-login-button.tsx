
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
  const redirectURI = typeof window !== 'undefined' ? `${window.location.origin}/apple-callback` : '';
  
  useEffect(() => {
    if (!isScriptLoaded || !clientId || !redirectURI) return;

    const initializeApple = () => {
      try {
        if (window.AppleID) {
          AppleID.auth.init({
            clientId: clientId,
            scope: 'name email',
            redirectURI: redirectURI,
            usePopup: true,
          });
          setIsAppleReady(true);
        } else {
          // Retry if script hasn't attached AppleID to window yet
          setTimeout(initializeApple, 100);
        }
      } catch (error) {
        console.error('Error initializing AppleID', error);
        toast({
          variant: 'destructive',
          title: 'Apple Login Error',
          description: 'Could not initialize Apple Sign-In.',
        });
      }
    };
    
    initializeApple();

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
      if (error && error.error !== '1001') { // 1001 is user canceling
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
              <svg 
                role="img" 
                aria-label="Apple logo"
                className="h-5 w-5"
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.032 6.815c-1.637 0-3.23.982-4.148.982-1.033 0-2.25-1.01-3.555-1.01-1.68 0-3.195 1.01-4.148 2.536-.963 1.526-.58 4.205 1.09 5.679.846.733 1.83 1.11 2.805 1.11 1.01 0 2.06-.374 2.89-.374.82 0 1.95.405 3.12.405 1.14 0 2.22-.405 2.92-.405.7 0 1.77.374 2.76.374 1.08 0 2.12-.416 2.93-1.11.8-.702 1.22-1.71 1.25-1.75-.02-.01-3.41-1.32-3.43-4.9-.02-2.684 2.24-4.024 2.4-4.164-.97-1.428-2.5-2.35-4.13-2.35-1.95 0-3.66 1.07-4.57 1.07zM11.815.35c.21 1.26-1.28 2.32-2.4 2.35-1.12-.03-2.2-1.29-2.4-2.38C6.795.21 8.265-.9 9.385-.93c1.11-.02 2.23 1.05 2.43 2.28z"/>
              </svg>
              <span className="font-semibold text-base">Continue with Apple</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
