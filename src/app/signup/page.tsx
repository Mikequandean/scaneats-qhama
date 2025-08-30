
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
    window.location.href = `${API_BASE_URL}/api/appleauth/start`;
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
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="white"
              >
                <path d="M15.22,6.15a3.87,3.87,0,0,0-2.43,1,3.32,3.32,0,0,0-1,2.44,4.42,4.42,0,0,0,1.15,3.28,3.67,3.67,0,0,0,2.6,1.25,1.11,1.11,0,0,0,.52-.1,3.48,3.48,0,0,0,2-3.14A4.24,4.24,0,0,0,15.22,6.15Z" />
                <path d="M19.78,15.24a8.42,8.42,0,0,1-3.69,6.1,1,1,0,0,1-.6.25.86.86,0,0,1-.6-.25c-.2-.2-.2-.5,0-.71l.1-.1a4.27,4.27,0,0,0,1.1-2.06,8.69,8.69,0,0,0-.7-4.1,6.81,6.81,0,0,0-2.69-3.2,6.11,6.11,0,0,0-4-1.2,7.27,7.27,0,0,0-5.49,2.22A8.15,8.15,0,0,0,2.22,18.4a1,1,0,0,1-.5.35A.86.86,0,0,1,1.12,18a8.33,8.33,0,0,1,3.34-5.93,6.2,6.2,0,0,1,4.34-1.66,5.82,5.82,0,0,1,1.81.25,5.4,5.4,0,0,1,3.42,4.88c0,.1,0,.19,0,.29a6.2,6.2,0,0,1-1.39,4l-.1.1c-.2.2-.2.5,0,.71a.92.92,0,0,0,1.2,0,8.42,8.42,0,0,0,3.69-6.1A.86.86,0,0,1,20.38,14.64.88.88,0,0,1,19.78,15.24Z" />
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
