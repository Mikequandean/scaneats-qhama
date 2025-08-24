
'use client';

import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mic, CircleDollarSign } from 'lucide-react';

import { useToast } from '@/app/shared/hooks/use-toast';
import { useUserData } from '@/app/shared/context/user-data-context';
import { cn } from '@/app/shared/lib/utils';
import { API_BASE_URL } from '@/app/shared/lib/api';
import type { View } from '@/app/features/dashboard/dashboard.types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const SallyView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const [sallyResponse, setSallyResponse] = useState<string>(
    "I'm your personal assistant, ask me anything about your body."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { profile, setSubscriptionModalOpen, fetchProfile } = useUserData();

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

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
          setIsLoading(false);
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
        setIsLoading(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        // This is handled by other state changes to prevent race conditions.
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

    if (isLoading || !recognitionRef.current) return;

    setSallyResponse('');

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
  
  const handleApiCall = async (userInput: string) => {
    if (!userInput.trim()) {
      setIsRecording(false);
      return;
    }

    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Profile not loaded',
        description: 'Please wait for your profile to load.',
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
      setIsRecording(false);
      return;
    }

    setIsLoading(true);
    setIsRecording(true);
    setLoadingProgress(10);
    setSallyResponse(`Thinking about: "${userInput}"`);

    try {
      const payload = {
        clientDialogue: userInput,
        clientName: profile.name,
      };
      
      const response = await fetch(`${API_BASE_URL}/api/sally/body-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        setSubscriptionModalOpen(true);
        setSallyResponse('You need a subscription for this feature.');
        return;
      }

      if (response.status === 429) {
        setSallyResponse("You're out of credits! Please buy more.");
        toast({
          variant: 'destructive',
          title: 'Out of Credits',
          description:
            'You have used all your credits. Please buy more to continue talking to Sally.',
          action: (
            <Button
              onClick={() => onNavigate('credits')}
              className="gap-2"
            >
              <CircleDollarSign />
              Buy Credits
            </Button>
          ),
        });
        return;
      }
      
      if (!response.ok) {
        throw response;
      }

      const responseData = await response.json();
      const result = responseData.result;
      const audioSpeech = responseData.audioSpeech;

      if (!result || !result.agentDialogue) {
        throw new Error("Sally didn't provide a response.");
      }

      setSallyResponse(result.agentDialogue);
      
      if (audioSpeech && audioSpeech.fileContents && audioRef.current) {
        setIsAudioLoading(true);
        const audioSrc = `data:audio/mpeg;base64,${audioSpeech.fileContents}`;
        const audio = audioRef.current;
        audio.src = audioSrc;

        const playPromise = audio.play();
        if (playPromise) {
            playPromise.then(() => setIsAudioLoading(false))
            .catch(err => {
                console.error("Audio playback error:", err);
                setIsAudioLoading(false);
                toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not play audio.'});
            });
        }
      }
      
      await fetchProfile(); // Refresh credits
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
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setIsRecording(false);
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-100 to-blue-50 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_55px_8px_rgba(110,100,150,0.45)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="relative flex h-[130px] w-[130px] shrink-0 items-center justify-center">
          <div
            className="absolute top-1/2 left-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 animate-breathe-glow-sally rounded-full"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255, 235, 255, 0.7) 10%, rgba(200, 190, 255, 0.8) 40%, rgba(170, 220, 255, 1.0) 65%, rgba(200, 240, 255, 1.0) 72%, rgba(135, 206, 250, 0) 80%)',
            }}
          />

          {isRecording && !isLoading && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2">
              <div className="absolute top-0 left-0 h-full w-full animate-siri-wave-1 rounded-full border-2 border-white/60"></div>
              <div className="absolute top-0 left-0 h-full w-full animate-siri-wave-2 rounded-full border-2 border-white/60"></div>
              <div className="absolute top-0 left-0 h-full w-full animate-siri-wave-3 rounded-full border-2 border-white/60"></div>
              <div className="absolute top-0 left-0 h-full w-full animate-siri-wave-4 rounded-full border-2 border-white/60"></div>
            </div>
          )}

          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={cn(
              'relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-95',
              isRecording
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-gradient-to-r from-[#4a148c] to-[#311b92] hover:from-[#5f1ca7] hover:to-[#4024b3]',
              isLoading && 'cursor-not-allowed',
              'shadow-[inset_0_2px_4px_0_rgba(255,255,255,0.4),0_0_15px_5px_rgba(255,255,255,0.8),0_0_30px_15px_rgba(255,255,255,0.5),0_0_50px_25px_rgba(220,230,255,0.3)]'
            )}
            aria-label="Activate Voice AI"
          >
            {isLoading ? (
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            ) : (
              <Mic
                className="h-10 w-10 text-white"
                style={{
                  textShadow:
                    '0 1px 2px rgba(0,0,0,0.2), 0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(180,140,255,0.7)',
                }}
              />
            )}
          </button>
        </div>

        <div className="flex h-auto min-h-[4rem] w-full flex-col justify-center rounded-2xl border border-white/40 bg-white/80 p-3 text-left shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_10px_30px_3px_rgba(100,90,140,0.45)] backdrop-blur-sm backdrop-saturate-150">
          {isLoading ? (
            <div className="space-y-2 text-center">
              <Progress value={loadingProgress} className="w-full" />
              <p className="text-[13px] text-gray-600">Sally is thinking...</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-grow text-[13px] leading-tight text-black">
                <strong>Sally</strong>
                <span className="text-gray-600"> - {sallyResponse}</span>
              </div>
              {isAudioLoading && (
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              )}
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
