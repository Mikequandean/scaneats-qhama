
'use client';

import { Button } from '@/components/ui/button';
import { FaApple } from 'react-icons/fa';

export default function AppleLoginButton({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const openAppleLoginPopup = () => {
    const redirectURI = 'https://scaneats-api.azurewebsites.net/api/auth/apple/callback';
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

    if (!clientId) {
      console.error("FATAL: NEXT_PUBLIC_APPLE_CLIENT_ID is not defined.");
      return;
    }

    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectURI,
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post', // Important for popup flow
      state: 'STATE',
    }).toString()}`;

    const popup = window.open(
      appleAuthUrl,
      'apple-login-popup',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
      }
    }, 500);
  };

  return (
    <Button
      variant="outline"
      onClick={openAppleLoginPopup}
      className="h-[40px] w-full max-w-[320px] bg-black text-white hover:bg-zinc-800 hover:text-white border-black"
    >
      <FaApple className="mr-2 h-5 w-5" />
      Sign in with Apple
    </Button>
  );
}
