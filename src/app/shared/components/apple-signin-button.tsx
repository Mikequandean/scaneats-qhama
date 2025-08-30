
'use client';

import { Button } from '@/components/ui/button';

export function AppleSignInButton() {
  const handleAppleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

    if (
      !clientId ||
      !redirectUri ||
      clientId === 'YOUR_APPLE_SERVICES_ID_HERE'
    ) {
      console.error(
        'Apple Sign-In is not configured. Please set NEXT_PUBLIC_APPLE_SERVICES_ID and NEXT_PUBLIC_APPLE_REDIRECT_URI in your .env file.'
      );
      // Optionally, show a user-friendly error message
      alert(
        'Apple Sign-In is not configured correctly. Please contact support.'
      );
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('apple_auth_state', state);

    const scope = 'name email';
    const responseType = 'code';

    const authUrl =
      'https://appleid.apple.com/auth/authorize' +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${encodeURIComponent(responseType)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scope)}` +
      '&response_mode=form_post';

    window.location.href = authUrl;
  };

  return (
    <Button
      onClick={handleAppleSignIn}
      type="button"
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
  );
}
