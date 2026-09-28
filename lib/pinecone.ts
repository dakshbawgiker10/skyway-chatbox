import { Pinecone } from "@pinecone-database/pinecone";

const EMBED_MODEL = "multilingual-e5-large";
const BATCH = 24;

let pinecone: Pinecone | null = null;

export function getPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not configured.");
  }
  if (!pinecone) pinecone = new Pinecone({ apiKey });
  return pinecone;
}

export function getIndex() {
  const name = process.env.PINECONE_INDEX_NAME;
  if (!name) {
    throw new Error("PINECONE_INDEX_NAME is not configured.");
  }
  return getPinecone().index(name);
}

export async function embedTexts(
  texts: string[],
  inputType: "passage" | "query"
): Promise<number[][]> {
  if (!texts.length) return [];

  const pc = getPinecone();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const result = await pc.inference.embed(EMBED_MODEL, batch, {
      inputType,
      truncate: "END",
    });

    for (const item of result.data) {
      const values =
        "values" in item && Array.isArray(item.values) ? item.values : null;
      if (!values) {
        throw new Error("Pinecone embedding response was missing vector values.");
      }
      vectors.push(values);
    }
  }

  return vectors;
}
