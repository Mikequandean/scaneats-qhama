'use server';
/**
 * @fileOverview A flow to deduct credits from a user's account via the API.
 * - deductCredits - A function that triggers the credit deduction.
 */

import { z } from 'zod';
import { API_BASE_URL } from '@/app/shared/lib/api';

export const DeductCreditsInputSchema = z.object({
  authToken: z.string().describe('The authentication token for the user.'),
  amount: z.number().int().positive().describe('The number of credits to deduct.'),
});
export type DeductCreditsInput = z.infer<typeof DeductCreditsInputSchema>;

export const DeductCreditsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeductCreditsOutput = z.infer<typeof DeduDeductCreditsOutputSchema>;

export async function deductCredits(input: DeductCreditsInput): Promise<DeductCreditsOutput> {
  const { authToken, amount } = input;

  try {
    const response = await fetch(`${API_BASE_URL}/api/event/deduct-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(amount), // The endpoint expects an integer in the body
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || 'Credits deducted successfully.' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || 'Failed to deduct credits.' };
    }
  } catch (error: any) {
    console.error('Error in deductCredits flow:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}
