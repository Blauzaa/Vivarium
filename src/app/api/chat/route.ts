/* eslint-disable @typescript-eslint/no-explicit-any */
import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const spawnCreatureParameters = z.object({
  count: z.number(),
  color: z.enum(['red', 'blue', 'green', 'yellow']),
});

const changeWeatherParameters = z.object({
  condition: z.enum(['sunny', 'rain', 'storm']),
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      messages,
      system: `You are "GAIA", the AI God of Project Vivarium.`,
      tools: {
        spawnCreature: tool({
          description: 'Spawn new creatures',
          parameters: z.object({
            count: z.number(),
            color: z.enum(['red', 'blue', 'green', 'yellow']),
          }),
          execute: async ({ count, color }: { count: number, color: string }) => {
            return `Creating ${count} ${color} organisms.`;
          },
        } as any),
        changeWeather: tool({
          description: 'Change weather',
          parameters: z.object({
            condition: z.enum(['sunny', 'rain', 'storm']),
          }),
          execute: async ({ condition }: { condition: string }) => {
            return `Changing weather to ${condition}.`;
          }
        } as any),
      },
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}