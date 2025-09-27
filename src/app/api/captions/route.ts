import { NextResponse } from "next/server";
import { openai as echoOpenAI } from "@/echo";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

/* Schemas */
const ShortSchema = z.object({
  type: z.literal("short"),
  options: z.array(z.string().max(280)).min(2).max(10),
});
const LongSchema = z.object({
  type: z.literal("long"),
  options: z.array(z.string().min(281).max(2000)).min(2).max(6),
});
const ThreadSchema = z.object({
  type: z.literal("thread"),
  options: z.array(z.array(z.string().max(280)).min(2).max(20)).min(2).max(6),
});
const ResultSchema = z.discriminatedUnion("type", [
  ShortSchema,
  LongSchema,
  ThreadSchema,
]);

/* System prompt */
const SYSTEM = `You are X Caption Pro, an expert Twitter (X) copywriter.
You will receive "length": "short" | "long" | "thread".
- If "short": {"type":"short","options":[...]} with each <= 280 chars.
- If "long": {"type":"long","options":[...]} ~600–1500 chars (for X Premium).
- If "thread": {"type":"thread","options":[[t1,t2,...],[...]]}, each tweet <= 280 chars.
Keep language (VI/EN) same as user input. Use emojis/hashtags only when helpful. No quotation marks around captions.`;

/* Handler */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    topic,
    tone = "witty",
    audience = "Crypto Twitter",
    keywords = "",
    count = 6,
    length = "short",
  } = body || {};

  const n = Math.min(Math.max(Number(count) || 6, 2), 10);
  const mode: "short" | "long" | "thread" =
    ["short", "long", "thread"].includes(length) ? length : "short";

  const userPrompt = `length: ${mode}
Return ${n} options.
Topic: ${topic || "general"}
Tone: ${tone}
Audience: ${audience}
Keywords: ${keywords || "none"}`;

  try {
    const { object } = await generateObject({
      model: echoOpenAI("gpt-4o-mini"),
      system: SYSTEM,
      prompt: userPrompt,
      temperature: 0.9,
      schema: ResultSchema,
    });
    return NextResponse.json(object);
  } catch (err: any) {
    // Trả lỗi rõ ràng để UI biết nhắc người dùng "Connect"
    const msg =
      typeof err?.message === "string" ? err.message : "Echo auth required";
    return NextResponse.json(
      { error: msg, hint: 'Click "Connect" (top-right) to link Echo, then retry.' },
      { status: 401 }
    );
  }
}
