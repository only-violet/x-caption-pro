"use client";

import { useMemo, useState } from "react";
import { splitToTweets } from "@/lib/splitToTweets";

const TONE_PRESETS = ["witty", "informative", "hype", "casual", "professional"];
const AUD_PRESETS = ["Crypto Twitter", "VN Crypto", "Builders", "Traders"];

type LengthMode = "short" | "thread" | "long";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("witty");
  const [audience, setAudience] = useState("VN Crypto");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [lengthMode, setLengthMode] = useState<LengthMode>("short");
  const [respType, setRespType] = useState<"tweet" | "caption" | "thread">("tweet");

  // Giả sử bạn đã có hàm gọi API để sinh nội dung:
async function generate() {
  setLoading(true);
  try {
    const lengthInstruction =
      lengthMode === "short"
        ? "Write a single tweet no longer than 280 characters."
        : lengthMode === "thread"
        ? "Write a Twitter thread. Each tweet ≤280 chars, natural breaks, add 1/n numbering."
        : "Write a long-form caption with no character limit (multiple paragraphs).";

    const prompt = `
Tone: ${tone}
Audience: ${audience}
${lengthInstruction}

Topic: ${topic}
${keywords ? `Keywords: ${keywords}` : ""}
`;

    // Gọi trực tiếp model (ví dụ OpenAI SDK)
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini", // đổi thành model bạn dùng
      messages: [
        { role: "system", content: "You are a caption generator for X (Twitter)." },
        { role: "user", content: prompt },
      ],
      max_tokens: lengthMode === "long" ? 1500 : 500,
    });

    const text = resp.choices[0]?.message?.content ?? "";
    setOptions([text]);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="mx-auto max-w-3xl p-4 space-y-6">
      {/* Inputs */}
      <section className="grid gap-3">
        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="Topic (ví dụ: Monad oracles upgrade...)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-xl px-3 py-2"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONE_PRESETS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="border rounded-xl px-3 py-2"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            {AUD_PRESETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Length selector */}
          <select
            className="border rounded-xl px-3 py-2"
            value={lengthMode}
            onChange={(e) => setLengthMode(e.target.value as LengthMode)}
          >
            <option value="short">Short (≤280)</option>
            <option value="thread">Thread (tự cắt 280/ tweet)</option>
            <option value="long">Long (không giới hạn)</option>
          </select>
        </div>

        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="Keywords (tùy chọn)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />

        <button
          onClick={generate}
          disabled={loading}
          className="rounded-2xl px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </section>

      {/* Outputs */}
      <section className="space-y-6">
        {options.map((opt, idx) => {
          const isLong = lengthMode === "long";
          const isThread = lengthMode === "thread";
          const isShort = lengthMode === "short";
          const tweets = isThread ? splitToTweets(opt, 280, true) : null;

          const overLimit = isShort && opt.length > 280;

          return (
            <div key={idx} className="rounded-2xl border p-4 space-y-3">
              <div className="text-sm text-gray-500">
                {isShort && (overLimit ? `⚠️ ${opt.length}/280` : `${opt.length}/280`)}
                {isThread && `Thread • ${tweets?.length} tweets`}
                {isLong && `Long • ${opt.length} chars`}
              </div>

              {/* Render theo chế độ */}
              {isThread ? (
                <ol className="space-y-3 list-decimal pl-5">
                  {tweets!.map((t, i) => (
                    <li key={i} className="whitespace-pre-wrap">{t}</li>
                  ))}
                </ol>
              ) : (
                <pre className="whitespace-pre-wrap">{opt}</pre>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => navigator.clipboard.writeText(
                    isThread ? tweets!.join("\n\n") : opt
                  )}
                  className="px-3 py-1 rounded-xl border"
                >
                  Copy
                </button>

                {isShort && overLimit && (
                  <span className="text-xs text-red-500">
                    Nội dung vượt 280 — đổi sang “Thread” hoặc “Long”.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
