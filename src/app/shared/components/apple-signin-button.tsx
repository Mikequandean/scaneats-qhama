
'use client';

import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/app/shared/lib/api';

export function AppleSignInButton() {

  const handleAppleSignIn = () => {
    // The backend now handles building the Apple URL and redirecting the user.
    const startUrl = `${API_BASE_URL}/api/auth/apple/start`;
    // Redirect the user to our backend, which will then redirect to Apple.
    window.location.href = startUrl;
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
