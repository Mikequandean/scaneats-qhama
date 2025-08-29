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
      <span className="font-semibold text-base">Sign in with Apple</span>
    </Button>
  );
}
