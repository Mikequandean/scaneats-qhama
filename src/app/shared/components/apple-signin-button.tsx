
'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useToast } from '@/app/shared/hooks/use-toast';

export function AppleSignInButton() {
  const { toast } = useToast();

  const handleAppleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

    if (
      !clientId ||
      !redirectUri ||
      clientId === 'YOUR_APPLE_SERVICES_ID_HERE' ||
      redirectUri === 'YOUR_APPLE_REDIRECT_URI_HERE'
    ) {
      console.error(
        'Apple Sign-In is not configured. Please set NEXT_PUBLIC_APPLE_SERVICES_ID and NEXT_PUBLIC_APPLE_REDIRECT_URI in your .env file.'
      );
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Apple Sign-In is not configured correctly. Please contact support.',
      });
      return;
    }

    // A unique state value should be generated for each sign-in request.
    const state = Math.random().toString(36).substring(2, 15);

    const scope = 'name email';
    const responseType = 'code'; // Use 'code' for server-side validation
    const responseMode = 'form_post'; // Recommended for security

    const authUrl =
      'https://appleid.apple.com/auth/authorize' +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${encodeURIComponent(responseType)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_mode=${encodeURIComponent(responseMode)}`;

    // Redirect the user to Apple's sign-in page
    window.location.href = authUrl;
  };

  return (
    <Button
      onClick={handleAppleSignIn}
      type="button"
      className="h-[44px] w-full max-w-[320px] rounded-sm border-black bg-black text-white hover:bg-zinc-800 flex items-center justify-center gap-2"
    >
      <svg
        role="img"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.048-3.804 1.236-4.824 3.12C2.28 10.892.813 15.34 2.64 18.93c.948 1.835 2.565 2.952 4.284 2.952 1.62 0 2.28-.936 4.176-.936 1.896 0 2.52.936 4.14.936 1.716 0 3.264-1.116 4.212-2.928.828-1.524 1.2-3.036 1.224-3.132-.024-.012-2.316-.888-2.34-3.588.012-2.364 1.872-3.456 2.04-3.672-1.14-1.764-2.856-2.82-4.8-2.82-2.208 0-3.528 1.416-4.416 1.416zM11.18 3.092c.792-1.044 1.416-2.232 1.116-3.092-1.392.072-2.952.888-3.852 2.04-.84.984-1.584 2.304-1.296 3.552 1.584.132 3.024-.504 3.888-2.52z"></path>
      </svg>
      <span className="text-base font-semibold">Sign in with Apple</span>
    </Button>
  );
}
