'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthBackgroundImage } from '@/app/shared/components/auth-background-image';
import { User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  email: string;
  jti: string;
}


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
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
  }

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/googleauth/onetap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      if (response.ok) {
        const data = await response.json();
        handleToken(data.token, 'Google');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google One Tap login failed.');
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

  const handleGoogleError = () => {
    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: 'Google authentication failed. Please try again.',
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Registration successful. Please log in.',
        });
        router.push('/login');
      } else {
        let errorMessage = 'An unknown error occurred during registration.';
        if (response.status >= 500) {
          errorMessage =
            'Our servers are currently unavailable. Please try again later.';
        } else {
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Keep the generic message
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    // Redirect to your backend endpoint that initiates the Apple OAuth flow
    window.location.href = `${API_BASE_URL}/api/auth/apple/signin`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuthBackgroundImage />
      <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-black/70 p-8 backdrop-blur-md">
        <div className="mb-8 text-left">
          <h1 className="font-headline text-4xl font-bold leading-tight">
            Create your
            <br />
            account
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative border-b border-white/40 py-2">
            <User className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative border-b border-white/40 py-2">
            <Mail className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative border-b border-white/40 py-2">
            <KeyRound className="absolute left-0 top-3 h-5 w-5 text-white/70" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-0 bg-transparent pl-8 text-base placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="terms"
              required
              className="h-5 w-5 rounded border-primary data-[state=checked]:bg-primary"
            />
            <Label htmlFor="terms" className="text-sm text-white/70">
              I agree to the{' '}
              <Link
                href="/privacy-policy"
                className="font-semibold text-white underline hover:no-underline"
              >
                Terms & Conditions
              </Link>
            </Label>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-zinc-900 py-6 text-base font-semibold hover:bg-zinc-800"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/70 px-2 text-white/70">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="320px"
          />
          <Button
            onClick={handleAppleSignIn}
            variant="outline"
            className="w-full max-w-[320px] h-[44px] bg-black text-white border-zinc-900 hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-sm"
          >
            <svg
              role="img"
              width="20"
              height="20"
              aria-label="Apple logo"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.032 6.815c-1.637 0-3.23.982-4.148.982-1.033 0-2.25-1.01-3.555-1.01-1.68 0-3.195 1.01-4.148 2.536-.963 1.526-.58 4.205 1.09 5.679.846.733 1.83 1.11 2.805 1.11 1.01 0 2.06-.374 2.89-.374.82 0 1.95.405 3.12.405 1.14 0 2.22-.405 2.92-.405.7 0 1.77.374 2.76.374 1.08 0 2.12-.416 2.93-1.11.8-.702 1.22-1.71 1.25-1.75-.02-.01-3.41-1.32-3.43-4.9-.02-2.684 2.24-4.024 2.4-4.164-.97-1.428-2.5-2.35-4.13-2.35-1.95 0-3.66 1.07-4.57 1.07zM11.815.35c.21 1.26-1.28 2.32-2.4 2.35-1.12-.03-2.2-1.29-2.4-2.38C6.795.21 8.265-.9 9.385-.93c1.11-.02 2.23 1.05 2.43 2.28z"/>
            </svg>
            <span className="font-semibold text-base">Sign in with Apple</span>
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
