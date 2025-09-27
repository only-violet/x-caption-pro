import { NextResponse } from "next/server";
import { openai as echoOpenAI, isSignedIn } from "@/echo";
import { generateObject } from "ai";
import OpenAI from "openai";
import { z } from "zod";

const ShortSchema = z.object({
  type: z.literal("short"),
  options: z.array(z.string().max(280)).min(3).max(10),
});
const LongSchema = z.object({
  type: z.literal("long"),
  // dài cho Premium; bạn có thể tăng max tuỳ ý
  options: z.array(z.string().min(281).max(2000)).min(2).max(6),
});
const ThreadSchema = z.object({
  type: z.literal("thread"),
  // mỗi phần tử là 1 thread (nhiều tweet)
  options: z.array(z.array(z.string().max(280)).min(2).max(12)).min(2).max(6),
});
const ResultSchema = z.discriminatedUnion("type", [
  ShortSchema,
  LongSchema,
  ThreadSchema,
]);

const SYSTEM = `You are X Caption Pro, an expert Twitter (X) copywriter.
You'll receive a "length" parameter: "short" | "long" | "thread".
- If short: return {"type":"short","options":[...]} with each <= 280 chars.
- If long: return {"type":"long","options":[...]} ~600–1500 chars each (for X Premium users).
- If thread: return {"type":"thread","options":[[t1,t2,...],[...],...]}.
  Each tweet <= 280 chars; NO quotes; minimal hashtags/emojis; strong hooks.
Keep language (VI/EN) consistent with the user's topic.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic,
      tone = "witty",
      audience = "Crypto Twitter",
      keywords = "",
      count = 6,
      length = "short",
    } = body || {};

    const n = Math.min(Math.max(Number(count) || 6, 2), 10);
    const mode = ["short", "long", "thread"].includes(length) ? length : "short";

    const prompt = `length: ${mode}
Return ${n} options.
Topic: ${topic || "general"}
Tone: ${tone}
Audience: ${audience}
Keywords: ${keywords || "none"}`;

    // Dùng Echo nếu người dùng đã Connect
    if (await isSignedIn()) {
      const { object } = await generateObject({
        model: echoOpenAI("gpt-4o-mini"),
        system: SYSTEM,
        prompt,
        temperature: 0.9,
        schema: ResultSchema,
      });
      return NextResponse.json(object);
    }

    // Fallback OpenAI (cần OPENAI_API_KEY trên Vercel)
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    });
    return NextResponse.json(
      JSON.parse(completion.choices[0].message!.content!)
    );
  } catch (e: any) {
    console.error("CAPTIONS_API_ERROR", e);
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}
