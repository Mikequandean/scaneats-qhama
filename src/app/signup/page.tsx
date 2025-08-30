
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
    // Redirect to the backend endpoint that initiates the Apple OAuth flow
    window.location.href = `${API_BASE_URL}/api/auth/apple/start`;
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
            className="w-full max-w-[320px] h-[44px] bg-black text-white border-black hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-sm"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12.016 16.12c-1.393 0-2.832-.823-3.886-2.454-1.048-1.631-.49-4.321.84-5.877a4.915 4.915 0 014.049-1.989c.219 0 .416.02.613.06-.11.02-.24.04-.33.04-.55 0-1.12-.119-1.7-.358a.48.48 0 00-.51.139c-1.07 1.258-1.685 2.857-1.685 4.547 0 2.279 1.154 3.498 1.843 3.498.49 0 1.02-.12 1.63-.338a.482.482 0 00.511-.63c.04-.1.06-.24.06-.339-.178.02-.357.02-.55.02a5.05 5.05 0 01-1.286-.16zm6.183-4.223c-.02-.1-.04-.2-.06-.318a4.945 4.945 0 00-3.32-2.932.482.482 0 00-.61.358c-.378 1.317-.84 2.595-1.528 3.734a.48.48 0 00.278.852c.47-.02.93-.16 1.35-.398.77-.358 1.28-.716 2.01-1.013a5.86 5.86 0 00.87-.398zm-1.843-6.52c1.33-1.474 2.22-3.37 2.22-5.377a.48.48 0 00-.47-.5h-.04c-1.55 0-3.26.88-4.43 2.158-.98 1.077-1.84 2.536-2.26 4.148a.483.483 0 00.41.59c.04.02.1.02.14.02.43 0 .8-.28.93-.658.55-1.533 1.28-2.858 2.42-3.759v.02z" />
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
