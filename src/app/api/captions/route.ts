import { NextResponse } from "next/server";
import { openai } from "@/echo";           // model adapter của Echo (Vercel AI SDK)
import { generateObject } from "ai";       // API chuẩn của Vercel AI SDK
import { z } from "zod";

const SYSTEM = `You are X Caption Pro, an expert Twitter (X) copywriter.
Return JSON: {"options": string[]}
Rules:
- 4–8 options, any length of characters.
- Keep it punchy; hook rõ ràng; tránh rườm rà.
- Viết theo ngôn ngữ của input (VI/EN).
- Chỉ dùng emoji/hashtag khi thực sự cần; không bọc caption trong dấu ngoặc kép.`;

export async function POST(req: Request) {
  const { topic, tone = "witty", audience = "Crypto Twitter", keywords = "", count = 6 } =
    await req.json();

  const n = Math.min(Math.max(Number(count) || 6, 3), 10);
  const prompt = `Topic: ${topic || "general"}
Tone: ${tone}
Audience: ${audience}
Keywords: ${keywords || "none"}
Return ${n} diverse options.`;

  // Dùng generateObject + schema để nhận JSON chuẩn
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),   // dùng billing qua Echo
    system: SYSTEM,
    prompt,
    temperature: 0.9,
    schema: z.object({
      options: z.array(z.string().max(280)).min(3).max(10),
    }),
  });

  return NextResponse.json(object); // -> { options: [...] }
}
