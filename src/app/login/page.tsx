'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGoogleOneTapLogin, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthBackgroundImage } from '@/app/shared/components/auth-background-image';
import { KeyRound, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  jti: string;
}


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToken = (token: string, source: string) => {
    localStorage.setItem('authToken', token);
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      localStorage.setItem('userId', decodedToken.sub);
      localStorage.setItem('userEmail', decodedToken.email);
      router.replace('/dashboard');
    } catch (error) {
      console.error(`Failed to decode token from ${source}`, error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'There was a problem with your login token. Please try again.',
      });
      localStorage.removeItem('authToken');
      router.replace('/login');
    }
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      handleExternalAuth(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.log('One Tap login error');
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: 'Google authentication failed. Please try again.',
    });
  };

  // This effect handles the token from the URL after external auth (Google, Apple)
  useEffect(() => {
    if (!searchParams) {
      return;
    }
    const tokenFromUrl = searchParams.get('token');

    if (tokenFromUrl) {
      handleToken(tokenFromUrl, 'URL');
    }
  }, [router, searchParams, toast]);


  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleExternalAuth = async (idToken: string) => {
    if (!idToken) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Google ID token is missing.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/googleauth/onetap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        let errorMsg = 'Google login failed.';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.token || !data.user || !data.user.id || !data.user.email) {
        throw new Error('Invalid response received from server.');
      }
      handleToken(data.token, 'Google');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useGoogleOneTapLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    disabled: !!(searchParams && searchParams.get('token'))
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: email,
          Password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        handleToken(data.token, 'Email/Password');
      } else {
        let errorMessage = 'An unknown error occurred during login.';
        if (response.status === 401) {
          errorMessage = 'Incorrect email or password. Please try again.';
        } else if (response.status >= 500) {
          errorMessage =
            'Our servers are currently unavailable. Please try again later.';
        } else {
          try {
            const errorData = await response.json();
            if (errorData.error) errorMessage = errorData.error;
          } catch {}
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/appleauth/start`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuthBackgroundImage />
      <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-black/60 p-8 backdrop-blur-lg">
        <div className="mb-8 text-left">
          <h2 className="font-headline text-4xl font-bold leading-tight">
            Log into <br />
            your account
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative border-b border-white/40">
            <Mail className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative border-b border-white/40">
            <KeyRound className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Link
              href="/forgot-password"
              className="absolute right-0 top-3 text-sm text-white/70 transition-colors hover:text-white"
            >
              Forgot?
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="remember-me" className="text-white/70">
                Remember me
              </Label>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-stone-900 py-6 text-base font-semibold hover:bg-stone-800"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/60 px-2 text-white/70">
              Or log in with
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-full max-w-[320px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="320px"
            />
          </div>
          <Button
            onClick={handleAppleSignIn}
            className="w-full max-w-[320px] h-[44px] bg-black text-white border-black hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-sm"
          >
            <svg role="img" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.01,16.22c-1.39,0-2.34-0.81-3.69-0.81c-1.33,0-2.61,0.81-3.51,2.04c-1.13,1.53-2.19,4.2-0.5,6.58 c0.81,1.14,1.86,2.04,3.2,2.04c1.24,0,1.86-0.74,3.48-0.74c1.62,0,2.14,0.74,3.5,0.74c1.33,0,2.29-0.9,3.1-2.04 c1.68-2.38,0.59-5.12-0.69-6.58c-1.02-1.22-2.31-2.04-3.65-2.04C14.04,16.22,13.31,16.22,12.01,16.22z M15.1,10.6 c-0.03-2.04,1.53-3.62,3.45-3.62c0.3,0,1.74,0.22,2.61,1.53c-1.31,0.81-2.29,2.19-2.92,3.48c-0.61,1.25-1.23,2.7-2.19,2.7 c-0.05,0-0.95-0.12-1.6-1.5C14.02,12.59,15.13,11.23,15.1,10.6z"/>
            </svg>
            <span className="font-semibold text-base">Sign in with Apple</span>
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-white/70">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-white hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
