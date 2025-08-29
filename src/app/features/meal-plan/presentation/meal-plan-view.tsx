
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, Info, Mic, CircleDollarSign, PlayCircle } from 'lucide-react';
import { MealApiRepository } from '../data/meal-api.repository';
import { MealService } from '../application/meal.service';
import type { ScannedFood } from '@/app/domain/scanned-food';
import { useUserData } from '@/app/shared/context/user-data-context';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/shared/lib/utils';
import { API_BASE_URL } from '@/app/shared/lib/api';
import type { View } from '@/app/features/dashboard/dashboard.types';
import { generateSallySpeech } from '@/ai/flows/sally-tts-flow';
import { deductCredits } from '@/ai/flows/deduct-credits-flow';

const mealRepository = new MealApiRepository();
const mealService = new MealService(mealRepository);

export const MealPlanView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const { toast } = useToast();
  const { profile, setSubscriptionModalOpen, fetchProfile } = useUserData();
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [sallyResponse, setSallyResponse] = useState<string | null>(null);
  const [isSallyLoading, setIsSallyLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sallyProgress, setSallyProgress] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const fetchMealPlan = useCallback(async () => {
    setIsMealLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'Please log in to view your meal plan.',
      });
      setIsMealLoading(false);
      return;
    }

    try {
      const meal = await mealService.getLastMealPlan(token);
      setScannedFood(meal);
    } catch (error: any) {
      if (error.message === 'Session Expired') {
        toast({
          variant: 'destructive',
          title: 'Session Expired',
          description: 'Please log in to continue.',
        });
        // The layout will handle the redirect
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load meal plan',
          description: error.message,
        });
      }
    } finally {
      setIsMealLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  useEffect(() => {
    if (isSallyLoading) {
      const interval = setInterval(() => {
        setSallyProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSallyLoading]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleApiCall(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          setIsRecording(false);
          setIsSallyLoading(false);
          return;
        }
        if (event.error === 'network') {
          toast({
            variant: 'destructive',
            title: 'Speech Error',
            description:
              'Could not recognize speech: network error. Please check your connection.',
          });
        } else if (event.error === 'not-allowed') {
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description:
              'Please allow microphone access in your browser settings to use this feature.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Speech Error',
            description: `Could not recognize speech: ${event.error}. Please try again.`,
          });
        }
        setIsSallyLoading(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        // State is handled by other functions to prevent race conditions.
      };
    } else {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
      });
    }
  }, [toast]);

  const handleMicClick = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (isSallyLoading || !recognitionRef.current) return;
    setSallyResponse(null);
    setAudioSrc(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description:
          'Please allow microphone access in your browser settings to use this feature.',
      });
      setIsRecording(false);
    }
  };

  const handleTextToSpeech = async (text: string) => {
    if (!text || !profile) return;
    
    // Check for credits and subscription before generating audio
    if (!profile.isSubscribed) {
        setSubscriptionModalOpen(true);
        return;
    }
    if (profile.credits <= 0) {
        toast({
            variant: 'destructive',
            title: 'Out of Credits',
            description: 'Please buy more credits to use this feature.',
            action: (
                <Button onClick={() => onNavigate('credits')} className="gap-2">
                    <CircleDollarSign /> Buy Credits
                </Button>
            ),
        });
        return;
    }

    setIsAudioLoading(true);
    try {
      const { audioDataUri } = await generateSallySpeech({ text });
      setAudioSrc(audioDataUri);

      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        if (!isIos) {
          await audioRef.current.play();
        }
      }
    } catch (err) {
      console.error('Genkit TTS Error:', err);
      toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not generate speech.' });
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleApiCall = async (userInput: string) => {
    if (!userInput.trim()) {
      setIsRecording(false);
      return;
    }

    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Data not loaded',
        description:
          'Please wait for your profile data to load.',
      });
      setIsRecording(false);
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please log in again.',
      });
      // The layout will handle the redirect
      setIsRecording(false);
      return;
    }

    // Subscription & Credit check before calling API
    if (!profile.isSubscribed) {
      setSubscriptionModalOpen(true);
      return;
    }
    if (profile.credits <= 0) {
      toast({
          variant: 'destructive',
          title: 'Out of Credits',
          description: 'You have used all your credits. Please buy more to continue talking to Sally.',
          action: (
              <Button onClick={() => onNavigate('credits')} className="gap-2">
                  <CircleDollarSign /> Buy Credits
              </Button>
          ),
      });
      return;
    }

    setIsSallyLoading(true);
    setIsRecording(true);
    setSallyProgress(10);
    setSallyResponse(`Thinking about: "${userInput}"`);

    try {
      const payload = {
        clientDialogue: userInput,
        clientName: profile.name,
      };

      // This endpoint now only returns text
      const response = await fetch(`${API_BASE_URL}/api/sally/meal-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403 || response.status === 429) {
          // This check is now mostly redundant but kept as a fallback.
          throw new Error('Subscription or credit issue detected on server.');
      }

      if (!response.ok) {
        throw response;
      }

      const responseData = await response.json();
      // The backend now returns a simplified object
      const sallyText = responseData.result.agentDialogue;

      if (!sallyText) {
        throw new Error("Sally didn't provide a response.");
      }
      
      setSallyResponse(sallyText);
      await handleTextToSpeech(sallyText);
      
    } catch (error: any) {
      let errorMessage = 'Sorry, I had a little trouble thinking. Please try again.';
      try {
        const errorData = await error.json();
        errorMessage = errorData.message || errorData.title || errorMessage;
      } catch (jsonError) {
        if (error instanceof Error) {
            errorMessage = error.message;
        }
      }
      
      setSallyResponse(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setSallyProgress(100);
      setTimeout(() => {
        setIsSallyLoading(false);
        setIsRecording(false);
      }, 500);
    }
  };

  const handlePlayAudio = async () => {
    if (audioRef.current && audioSrc) {
        setIsAudioLoading(true);
        try {
            await audioRef.current.play();
        } catch(err) {
            console.error("Manual audio playback error:", err);
            setIsAudioLoading(false);
            toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not play audio.'});
        }
    } else if (sallyResponse) {
        // If audio wasn't generated yet, generate it now
        await handleTextToSpeech(sallyResponse);
    }
  };

  const onAudioEnded = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Deduct 1 credit after audio plays successfully
    const result = await deductCredits({ authToken, amount: 1 });
    if (result.success) {
      await fetchProfile(); // Refresh credits in UI
      toast({ title: 'Credit Used', description: '1 credit has been deducted for using Sally.' });
    } else {
      toast({ variant: 'destructive', title: 'Credit Error', description: result.message });
    }
  };

  if (isMealLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!scannedFood) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <Info className="h-12 w-12 text-primary" />
          <h2 className="text-xl font-bold">No food scanned yet.</h2>
          <p className="text-muted-foreground">
            Scan an item to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex-grow">
      <video
        src="/images/gallery/MealPlannerPage.webm"
        className="fixed inset-0 -z-10 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />

      <div className="flex h-full w-full flex-col items-center p-5 pb-[155px] box-border overflow-y-auto">
        <header className="flex justify-between items-center mb-5 w-full max-w-[600px] px-[15px] box-sizing-border shrink-0">
          <div className="w-[150px] h-[75px] text-left">
            <Image
              src="/images/gallery/ScanEatsLogo.png"
              alt="ScanEats Logo"
              width={150}
              height={75}
              className="max-w-full max-h-full block object-contain"
            />
          </div>
        </header>

        <div className="text-center flex flex-col items-center mb-[25px] shrink-0">
          <div className="text-3xl md:text-4xl font-medium mb-2 text-white text-shadow-[0_0_10px_white]">
            {scannedFood.total.toFixed(0)}
          </div>
          <div className="text-sm md:text-base text-white bg-[rgba(34,34,34,0.7)] px-3 py-1.5 rounded-full tracking-wider">
            Total Calories
          </div>
        </div>

        <div className="flex justify-around items-stretch mb-[25px] w-full max-w-[550px] gap-[15px] flex-wrap shrink-0">
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Protein
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.protein.toFixed(0)}g
            </div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Fat
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.fat.toFixed(0)}g
            </div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Carbs
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.carbs.toFixed(0)}g
            </div>
          </div>
        </div>

        <button
          onClick={handleMicClick}
          className={cn(
            'flex flex-col justify-center items-center text-white rounded-full w-[120px] h-[120px] my-10 mx-auto text-base tracking-wider cursor-pointer border-2 border-[rgba(255,255,255,0.2)] transition-transform duration-200 ease-in-out shrink-0',
            isRecording
              ? 'bg-red-600'
              : 'bg-gradient-to-r from-[#4a148c] to-[#311b92]'
          )}
        >
          <Mic
            className="h-16 w-16"
            style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }}
          />
        </button>

        <div className="text-center mt-4 mb-8 text-white text-shadow-[0_0_6px_rgba(255,255,255,0.8),_0_0_3px_rgba(255,255,255,0.6)] text-lg font-normal bg-transparent px-5 py-3 rounded-2xl inline-block max-w-[85%] shadow-[0_0_15px_rgba(0,0,0,0.4),_0_0_5px_rgba(0,0,0,0.3)] border-l-4 border-[#a033ff] shrink-0">
          {isSallyLoading ? (
            <div className="space-y-2 text-center">
              <Progress value={sallyProgress} className="w-full" />
              <p className="text-sm text-gray-400">Sally is thinking...</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-grow">
                {sallyResponse ||
                  "Ask me about this meal and I'll tell you everything"}
              </span>
              {isAudioLoading ? (
                 <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              ) : (
                isIos && sallyResponse && (
                    <Button onClick={handlePlayAudio} variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-white hover:bg-white/10">
                        <PlayCircle className="h-5 w-5" />
                    </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" onEnded={onAudioEnded} onPlay={() => setIsAudioLoading(false)} />
    </div>
  );
};
