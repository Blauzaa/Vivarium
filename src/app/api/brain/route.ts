import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { stats, traits, nearby } = await req.json();

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are a slime brain.
      Output JSON ONLY: {"action": "ACTION_NAME"}
      ACTIONS: "WANDER", "EAT", "DRINK", "ATTACK", "MATE", "SLEEP"
      CONTEXT: Traits ${traits}, Hunger ${stats.hunger}, Thirst ${stats.thirst}`,
      prompt: `Decide next move based on ${nearby}`,
    });

    const cleanJson = text.replace(/```json|```/g, '').trim();
    return new Response(cleanJson, { headers: { 'Content-Type': 'application/json' } });

  } catch (_error) { // <--- PAKE UNDERSCORE
    return new Response(JSON.stringify({ action: "WANDER" }), { status: 200 });
  }
}