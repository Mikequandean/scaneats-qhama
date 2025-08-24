
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/app/shared/lib/api';

const FeatureListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-center text-sm text-gray-300">
    <div className="mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
      ✓
    </div>
    {children}
  </li>
);

type GeoData = {
  countryName: string;
  countryCode: string;
  currency: string;
  localPrice: string;
  flagUrl: string;
};

const ZAR_BASE_PRICE = 200;

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ variant: 'destructive', title: 'Authentication Error' });
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, toast]);
  
  useEffect(() => {
    const fetchGeoData = async () => {
      setIsGeoLoading(true);
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (!ipResponse.ok) throw new Error('Could not fetch location data.');
        const ipData = await ipResponse.json();

        const ratesResponse = await fetch('https://open.er-api.com/v6/latest/ZAR');
        if (!ratesResponse.ok) throw new Error('Could not fetch exchange rates.');
        const ratesData = await ratesResponse.json();

        const userCurrency = ipData.currency;
        const rate = ratesData.rates[userCurrency];

        if (rate) {
          const localPrice = ZAR_BASE_PRICE * rate;
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: userCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });

          setGeoData({
            countryName: ipData.country_name,
            countryCode: ipData.country_code,
            currency: userCurrency,
            localPrice: formatter.format(localPrice).replace(/\s/g, ''),
            flagUrl: `https://flagcdn.com/w40/${ipData.country_code.toLowerCase()}.png`,
          });
        } else {
          setGeoData(null);
        }
      } catch (error) {
        console.error("Geo pricing error:", error);
        setGeoData(null);
      } finally {
        setIsGeoLoading(false);
      }
    };
    
    fetchGeoData();
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');

    if (!token || !email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User information not found. Please log in again.',
      });
      setIsSubscribing(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/subscription/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email,
            planCode: 'PLN_so2f03hi5aa779d', // Ensure this is a valid plan code in your Paystack account
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.authorizationUrl) {
          window.location.href = result.authorizationUrl;
        } else {
          throw new Error('Payment URL not received.');
        }
      } else {
        let errorMessage = 'An unknown error occurred.';
        if (response.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
        } else if (response.status >= 500) {
            errorMessage = 'Our servers are experiencing issues. Please try again later.';
        } else {
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch {
                // Keep generic message
            }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: error.message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };
  
  const displayPrice = () => {
    if (isGeoLoading) {
      return <div className="h-[48px] flex items-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }
    if (geoData) {
      return (
        <div className="text-5xl font-semibold text-white">
          {geoData.localPrice}
          <span className="text-xl font-normal text-gray-400">/m = (ZAR {ZAR_BASE_PRICE})</span>
        </div>
      );
    }
    // Default price if geo location fails
    return (
      <div className="text-5xl font-semibold text-white">
        ${(ZAR_BASE_PRICE / 18).toFixed(0)}
        <span className="text-xl font-normal text-gray-400">/m</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-black p-5 text-gray-200">
       <Link
        href="/dashboard"
        className="absolute top-8 left-8 z-10 inline-block rounded-full border border-white/10 bg-zinc-800/60 py-2.5 px-4 text-sm font-medium text-white no-underline transition-colors hover:bg-zinc-700/80"
      >
        <div className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </div>
      </Link>

      <h1 className="main-title relative z-[1]">
        ScanEats.App
      </h1>

      <div className="relative z-[2] mt-5 w-full max-w-sm rounded-2xl border border-white/15 bg-[#2d2d2d]/45 p-10 text-left shadow-2xl backdrop-blur-[8px]">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex justify-between items-center">
                <div className="text-base font-medium text-gray-400">
                  Active Account
                </div>
                {isGeoLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                ) : (
                  geoData && (
                    <div className="flex items-center gap-2">
                      <Image 
                        src={geoData.flagUrl} 
                        alt={`${geoData.countryName} flag`} 
                        width={32} 
                        height={20}
                        className="rounded-sm" 
                      />
                    </div>
                  )
                )}
              </div>
              <div className="mt-2">
                {displayPrice()}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                🌍 Trusted by users worldwide — you're in good hands
              </p>
            </div>

            <ul className="flex list-none flex-col gap-4 p-0">
              <FeatureListItem>
                 24/7 Personal Assistant:
                 <span className="ml-1.5 rounded-sm bg-white/70 px-1 py-0.5 font-semibold text-black">
                   SALLY
                 </span>
               </FeatureListItem>
              <FeatureListItem>Unlimited Food Scanning</FeatureListItem>
              <FeatureListItem>Detailed Nutritional Analytics</FeatureListItem>
              <FeatureListItem>Ad-Free Experience</FeatureListItem>
            </ul>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isSubscribing}
                   className="cta-button mt-4 animate-breathe-glow"
                >
                  {isSubscribing ? (
                    <Loader2 className="mx-auto animate-spin" />
                  ) : (
                    'Activate Your Account'
                  )}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to subscribe to the Active Account plan for
                    ZAR {ZAR_BASE_PRICE}/month. This gives you unlimited access to all features.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubscribe} disabled={isSubscribing}>
                    {isSubscribing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm & Pay
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
