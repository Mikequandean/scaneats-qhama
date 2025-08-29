
'use server';
/**
 * @fileOverview A Genkit flow for generating Text-to-Speech audio using Sally's voice.
 *
 * - generateSallySpeech - A function that converts text into speech audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

export const SallySpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type SallySpeechInput = z.infer<typeof SallySpeechInputSchema>;

export const SallySpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated speech as a base64-encoded data URI in WAV format."),
});
export type SallySpeechOutput = z.infer<typeof SallySpeechOutputSchema>;


export async function generateSallySpeech(input: SallySpeechInput): Promise<SallySpeechOutput> {
  return sallyTtsFlow(input);
}

// Helper function to convert raw PCM audio data from Gemini to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const sallyTtsFlow = ai.defineFlow(
  {
    name: 'sallyTtsFlow',
    inputSchema: SallySpeechInputSchema,
    outputSchema: SallySpeechOutputSchema,
  },
  async ({ text }) => {
    // Generate audio using Gemini's TTS model
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using a prebuilt female voice that sounds youthful and clear for Sally
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio media was returned from the TTS model.');
    }

    // The audio is returned as a base64 data URI, we need the raw buffer
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the raw PCM audio buffer to a WAV base64 string
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
