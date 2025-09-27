"use client";
import { useState } from "react";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("witty");
  const [audience, setAudience] = useState("Crypto Twitter");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  async function onGenerate() {
    setLoading(true);
    setOptions([]);
    const res = await fetch("/api/captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, tone, audience, keywords, count: 6 }),
    });
    const data = await res.json();
    setOptions(data.options || []);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-bold mb-6">X Caption Pro</h1>

      <label className="block text-sm mb-1">Topic / Context</label>
      <textarea className="w-full border rounded p-3 mb-4" rows={4}
        placeholder="Ví dụ: recap testnet Monad / mời tham gia giveaway / announce nhỏ…"
        value={topic} onChange={e=>setTopic(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Tone</label>
          <select className="w-full border rounded p-2" value={tone} onChange={e=>setTone(e.target.value)}>
            <option value="witty">Witty</option><option value="informative">Informative</option>
            <option value="hype">Hype</option><option value="casual">Casual</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Audience</label>
          <input className="w-full border rounded p-2" value={audience}
            onChange={e=>setAudience(e.target.value)} placeholder="Crypto Twitter, VN crypto, devs…" />
        </div>
        <div>
          <label className="block text-sm mb-1">Keywords (optional)</label>
          <input className="w-full border rounded p-2" value={keywords}
            onChange={e=>setKeywords(e.target.value)} placeholder="comma,separated" />
        </div>
      </div>

      <button onClick={onGenerate} disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
        {loading ? "Generating…" : "Generate Captions"}
      </button>

      <div className="mt-8 space-y-4">
        {options.map((opt, i) => (
          <div key={i} className="border rounded p-4">
            <div className="text-xs text-gray-500 mb-1">#{i + 1} — {opt.length}/280</div>
            <p className="whitespace-pre-wrap">{opt}</p>
            <button
              className="mt-2 text-xs border rounded px-2 py-1"
              onClick={() => navigator.clipboard.writeText(opt)}>
              Copy
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
