"use client";

import { useMemo, useState } from "react";

const TONE_PRESETS = ["witty", "informative", "hype", "casual", "professional"];
const AUD_PRESETS = ["Crypto Twitter", "VN Crypto", "Builders", "Traders"];

export default function Page() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("witty");
  const [audience, setAudience] = useState("VN Crypto");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const canGenerate = useMemo(() => topic.trim().length > 0, [topic]);

  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    setOptions([]);
    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, audience, keywords, count: 6 }),
      });
      const data = await res.json();
      setOptions(data.options || []);
    } catch {
      alert("Failed to generate captions");
    } finally {
      setLoading(false);
    }
  }

  function tweetNow(text: string) {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-dvh px-5 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="glass rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-300 to-fuchsia-400 shadow-md" />
            <div>
              <h1 className="text-3xl font-bold leading-tight text-gradient-pink">
                X Caption Pro
              </h1>
              <p className="text-sm text-pink-700/70 dark:text-pink-200/70">
                Generate smart, engaging captions for Twitter (X) in seconds.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mt-6 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-pink-900/80 dark:text-pink-100 mb-1">
                Topic / Context
              </label>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: Recap testnet Monad; Invite to join giveaway; Opinion..."
                className="w-full rounded-2xl border border-pink-200/70 bg-white/80 dark:bg-white/5 p-4 shadow-sm outline-none
                           focus:ring-2 focus:ring-pink-400/60 focus:border-pink-400 transition"
              />
            </div>

            {/* Presets */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm font-medium text-pink-900/80 dark:text-pink-100">
                  Tone
                </div>
                <div className="flex flex-wrap gap-2">
                  {TONE_PRESETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition
                        ${tone === t
                          ? "bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-500/20 dark:text-pink-100"
                          : "bg-white/70 border-pink-200 hover:bg-white/90 dark:bg-white/5 dark:text-pink-100/80"}`}
                      aria-pressed={tone === t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-pink-900/80 dark:text-pink-100">
                  Audience
                </div>
                <div className="flex flex-wrap gap-2">
                  {AUD_PRESETS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAudience(a)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition
                        ${audience === a
                          ? "bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-500/20 dark:text-pink-100"
                          : "bg-white/70 border-pink-200 hover:bg-white/90 dark:bg-white/5 dark:text-pink-100/80"}`}
                      aria-pressed={audience === a}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-pink-900/80 dark:text-pink-100 mb-1">
                  Custom tone (optional)
                </label>
                <input
                  placeholder="vd: friendly, authoritative… "
                  className="w-full rounded-2xl border border-pink-200/70 bg-white/80 dark:bg-white/5 p-3 outline-none
                             focus:ring-2 focus:ring-pink-400/60 focus:border-pink-400"
                  onChange={(e) => setTone(e.target.value || "meme")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pink-900/80 dark:text-pink-100 mb-1">
                  Keywords (optional)
                </label>
                <input
                  placeholder="comma,separated,keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full rounded-2xl border border-pink-200/70 bg-white/80 dark:bg-white/5 p-3 outline-none
                             focus:ring-2 focus:ring-pink-400/60 focus:border-pink-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={generate}
                disabled={loading || !canGenerate}
                className="rounded-2xl px-5 py-2.5 font-semibold text-white shadow-lg transition
                           bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-500 hover:to-fuchsia-600
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Generating…" : "Generate Captions"}
              </button>
              <span className="text-xs text-pink-700/70 dark:text-pink-200/70">
                Character: {topic.length} / 500+ (input description)
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {options.length > 0 && (
          <div className="mt-8 grid gap-4">
            {options.map((opt, i) => (
              <div
                key={i}
                className="glass rounded-2xl border shadow-md p-5 transition hover:shadow-pink-200/60 dark:hover:shadow-none"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-pink-800/70 dark:text-pink-200/70">
                    Option #{i + 1}
                  </div>
                  <div className="text-xs text-pink-700/60 dark:text-pink-200/60">
                    {opt.length}/280
                  </div>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{opt}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(opt)}
                    className="rounded-xl border border-pink-200 bg-white/70 px-3 py-1.5 text-sm hover:bg-white/90 transition dark:bg-white/5"
                    aria-label="Copy"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => tweetNow(opt)}
                    className="rounded-xl px-3 py-1.5 text-sm text-white bg-pink-500 hover:bg-pink-600 transition"
                    aria-label="Tweet now"
                  >
                    Tweet now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
