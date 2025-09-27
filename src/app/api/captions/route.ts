// src/app/api/captions/route.ts
import { NextResponse } from "next/server";
import { openai as echoOpenAI } from "@/echo";        // model adapter từ Echo (Vercel AI SDK)
import { generateObject } from "ai";
import { z } from "zod";

// ---- SCHEMAS ----
const ShortSchema = z.object({
  type: z.literal("short"),
  options: z.array(z.string().max(280)).min(2).max(10),
});

const LongSchema = z.object({
  type: z.literal("long"),
  // Cho X Premium. Tăng/giảm max tuỳ nhu cầu.
  options: z.array(z.string().min(281).max(2000)).min(2).max(6),
});

const ThreadSchema = z.object({
  type: z.literal("thread"),
  // Mỗi phần tử trong options là 1 thread gồm nhiều tweet (mỗi tweet ≤ 280)
  options: z.array(z.array(z.string().max(280)).min(2).max(20)).min(2).max(6),
});

const ResultSchema = z.discriminatedUnion("type", [
  ShortSchema,
  LongSchema,
  ThreadSchema,
]);

// ---- SYSTEM RULES ----
const SYSTEM = `You are X Caption Pro, an expert Twitter (X) copywriter.
You will receive a "length" parameter: "short" | "long" | "thread".

General rules:
- Keep language consistent with the user's topic (VI/EN).
- Punchy hooks, no filler. Emojis/hashtags only when they add clarity.
- Do NOT wrap captions in quotes.

Short:
- Return {"type":"short","options":[...]} with each option ≤ 280 characters.

Long:
- Return {"type":"long","options":[...]} with ~600–1500 characters per option
  (for X Premium users). Still clean and scannable.

Thread:
- Return {"type":"thread","options":[[t1,t2,...], [...], ...]}.
- Each tweet in a thread MUST be ≤ 280 characters.
- Strong first tweet hook; logical flow; optional CTA in the last tweet.`;

// ---- HELPERS ----
function sanitizeThread(thread: string[][]): string[][] {
  // đảm bảo từng tweet ≤ 280 ký tự (cắt nhẹ nếu model lỡ vượt)
  return thread.map((tweets) =>
    tweets.map((t) => (t.length > 280 ? t.slice(0, 280) : t))
  );
}

async function callEchoModel(prompt: string) {
  return generateObject({
    model: echoOpenAI("gpt-4o-mini"),
    system: SYSTEM,
    prompt,
    temperature: 0.9,
    schema: ResultSchema,
  });
}

async function callOpenAIWithKey(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY for fallback.");
  // Dùng fetch raw để chạy tốt cả trên Edge/Node
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return { object: JSON.parse(content) };
}

// ---- HANDLER ----
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      topic,
      tone = "witty",
      audience = "Crypto Twitter",
      keywords = "",
      count = 6,
      length = "short", // "short" | "long" | "thread"
    } = body;

    const n = Math.min(Math.max(Number(count) || 6, 2), 10);
    const mode: "short" | "long" | "thread" =
      ["short", "long", "thread"].includes(length) ? length : "short";

    const prompt = `length: ${mode}
Return ${n} options.

Topic: ${topic || "general"}
Tone: ${tone}
Audience: ${audience}
Keywords: ${keywords || "none"}`;

    // 1) Thử dùng Echo (tự billing qua Echo)
    try {
      const { object } = await callEchoModel(prompt);
      if (object.type === "thread") {
        object.options = sanitizeThread(object.options);
      }
      return NextResponse.json(object);
    } catch (err) {
      // tiếp tục fallback
      console.error("[CAPTIONS] Echo call failed, trying OpenAI fallback:", err);
    }

    // 2) Fallback qua OpenAI key (OPENAI_API_KEY)
    const { object } = await callOpenAIWithKey(prompt);

    // đảm bảo chuẩn dữ liệu khi là thread
    if (object?.type === "thread" && Array.isArray(object.options)) {
      object.options = sanitizeThread(object.options);
    }

    // Nếu model trả về khác schema dự kiến, ta ép về short đơn giản
    const parsed = ResultSchema.safeParse(object);
    if (!parsed.success) {
      // fallback cực đoan: ép thành short một phần tử
      const flatText =
        typeof object === "object" && object !== null && "options" in object
          ? Array.isArray((object as any).options)
            ? (object as any).options.join("\n\n")
            : JSON.stringify(object)
          : "Unable to parse response.";
      return NextResponse.json({
        type: "short",
        options: [flatText.slice(0, 280)],
      });
    }

    return NextResponse.json(parsed.data);
  } catch (e: any) {
    console.error("CAPTIONS_API_ERROR", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
