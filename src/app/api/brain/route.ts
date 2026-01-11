/* eslint-disable @typescript-eslint/no-explicit-any */
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Cek apakah API KEY terbaca
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY tidak ditemukan di .env.local");
    }

    const { hunger, energy } = await req.json();

    // Inisialisasi Groq secara eksplisit
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'), // Ganti ke model yang lebih stabil
      system: `You are the survival instinct of a slime.
      Output valid JSON only: {"action": "ACTION_NAME"}
      ACTIONS: "WANDER", "EAT", "SLEEP"`,
      prompt: `Stats: Hunger ${hunger}%, Energy ${energy}%.`,
    });

    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    return new Response(cleanJson, { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    // --- INI BAGIAN PENTING ---
    // Log error ke Terminal VS Code (Bukan browser) biar ketahuan penyebabnya
    console.error("🔥 BRAIN ERROR:", error.message || error);
    
    // Kembalikan fallback action biar game gak macet
    return new Response(JSON.stringify({ action: "WANDER" }), { status: 200 });
  }
}