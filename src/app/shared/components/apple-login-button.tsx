
'use client';

import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/app/shared/lib/api';

export default function AppleLoginButton() {
  const handleAppleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/appleauth/start`;
  };

  return (
    <Button
      onClick={handleAppleSignIn}
      variant="outline"
      className="w-full max-w-[320px] h-[44px] bg-black text-white border-zinc-900 hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-sm"
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.01,16.22c-1.39,0-2.34-0.81-3.69-0.81c-1.33,0-2.61,0.81-3.51,2.04c-1.13,1.53-2.19,4.2-0.5,6.58 c0.81,1.14,1.86,2.04,3.2,2.04c1.24,0,1.86-0.74,3.48-0.74c1.62,0,2.14,0.74,3.5,0.74c1.33,0,2.29-0.9,3.1-2.04 c1.68-2.38,0.59-5.12-0.69-6.58c-1.02-1.22-2.31-2.04-3.65-2.04C14.04,16.22,13.31,16.22,12.01,16.22z M15.1,10.6 c-0.03-2.04,1.53-3.62,3.45-3.62c0.3,0,1.74,0.22,2.61,1.53c-1.31,0.81-2.29,2.19-2.92,3.48c-0.61,1.25-1.23,2.7-2.19,2.7 c-0.05,0-0.95-0.12-1.6-1.5C14.02,12.59,15.13,11.23,15.1,10.6z"/>
      </svg>
      <span className="font-semibold text-base">Sign in with Apple</span>
    </Button>
  );
}
