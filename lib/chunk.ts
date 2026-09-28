const TARGET_CHARS = 500;
const OVERLAP_CHARS = 80;

function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.length ? parts : [text.trim()].filter(Boolean);
}

export function chunkText(raw: string): string[] {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const sentences = splitSentences(cleaned);
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (!buffer) {
      buffer = sentence;
      continue;
    }

    if (`${buffer} ${sentence}`.length <= TARGET_CHARS) {
      buffer = `${buffer} ${sentence}`;
      continue;
    }

    chunks.push(buffer);

    const overlap = buffer.slice(Math.max(0, buffer.length - OVERLAP_CHARS));
    buffer = `${overlap} ${sentence}`.trim();

    while (buffer.length > TARGET_CHARS * 1.4) {
      chunks.push(buffer.slice(0, TARGET_CHARS));
      buffer = buffer.slice(TARGET_CHARS - OVERLAP_CHARS);
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks.filter((c) => c.length > 20);
}
