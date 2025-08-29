
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
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 fill-current"
              >
                <path d="M12.152 6.896c-1.626 0-3.213 1.077-4.145 1.077-1.028 0-2.254-1.043-3.56-1.043-1.68 0-3.195 1.08-4.143 2.668-.962 1.583-.58 4.343 1.09 5.864.845.74 1.83 1.14 2.803 1.14 1.01 0 2.06-.38 2.89-.38.82 0 1.95.42 3.12.42 1.14 0 2.22-.38 2.92-.38.7 0 1.77.38 2.76.38 1.08 0 2.12-.42 2.93-1.12.8-.7 1.22-1.74 1.25-1.78-.02-.01-3.41-1.34-3.43-5.04-.02-2.73 2.24-4.11 2.4-4.25-.97-1.46-2.5-2.4-4.13-2.4-1.95 0-3.66 1.1-4.57 1.1zM11.85.27c.21 1.29-1.28 2.37-2.4 2.4-1.12-.03-2.2-1.32-2.4-2.43-.22-1.11 1.25-2.22 2.37-2.25 1.11-.02 2.23 1.08 2.43 2.28z"></path>
              </svg>
              <span className="font-semibold text-base">Continue with Apple</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
