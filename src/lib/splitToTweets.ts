export function splitToTweets(
  text: string,
  maxLen = 280,
  addNumbers = true
): string[] {
  if (!text) return [];
  // Chuẩn hóa khoảng trắng
  const cleaned = text.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const chunks: string[] = [];

  let current = "";
  for (const w of words) {
    // Nếu từ quá dài, ta vẫn phải cắt cứng để tránh kẹt
    if (w.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      // cắt từ dài thành mảnh <= maxLen
      for (let i = 0; i < w.length; i += maxLen) {
        chunks.push(w.slice(i, i + maxLen));
      }
      continue;
    }

    if ((current + " " + w).trim().length <= maxLen) {
      current = (current ? current + " " : "") + w;
    } else {
      chunks.push(current);
      current = w;
    }
  }
  if (current) chunks.push(current);

  if (!addNumbers) return chunks;

  const total = chunks.length;
  // Dành chỗ cho " 1/n"
  return chunks.map((c, i) => {
    const suffix = ` ${i + 1}/${total}`;
    if (c.length + suffix.length <= maxLen) return c + suffix;
    // Nếu quá 280, rút bớt vài ký tự cuối để nhét suffix
    return c.slice(0, maxLen - suffix.length - 1) + "…" + suffix;
  });
}

