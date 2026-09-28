import { chunkText } from "@/lib/chunk";
import { embedTexts, getIndex } from "@/lib/pinecone";
import type { ChatSource, DocumentRecord } from "@/lib/types";

function previewOf(text: string): string {
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export async function upsertDocument(input: {
  filename: string;
  mimeType: string;
  text: string;
}): Promise<DocumentRecord> {
  const pieces = chunkText(input.text);
  if (!pieces.length) {
    throw new Error("No readable text was extracted from this file.");
  }

  const documentId = crypto.randomUUID();
  const uploadedAt = new Date().toISOString();
  const embeddings = await embedTexts(pieces, "passage");
  const index = getIndex();

  const records: Array<{
    id: string;
    values: number[];
    metadata: Record<string, string | number>;
  }> = pieces.map((text, i) => ({
    id: `${documentId}#${i}`,
    values: embeddings[i],
    metadata: {
      type: "chunk",
      documentId,
      filename: input.filename,
      mimeType: input.mimeType,
      chunkIndex: i,
      text,
      preview: previewOf(text),
      uploadedAt,
    },
  }));

  records.push({
    id: `catalog#${documentId}`,
    values: embeddings[0],
    metadata: {
      type: "catalog",
      documentId,
      filename: input.filename,
      mimeType: input.mimeType,
      chunkIndex: -1,
      text: "",
      preview: `${pieces.length} SOP chunks`,
      uploadedAt,
      chunkCount: pieces.length,
      charCount: input.text.length,
    },
  });

  for (let i = 0; i < records.length; i += 100) {
    await index.upsert(records.slice(i, i + 100));
  }

  return {
    id: documentId,
    filename: input.filename,
    mimeType: input.mimeType,
    uploadedAt,
    charCount: input.text.length,
    chunkCount: pieces.length,
  };
}

export async function queryRelevantChunks(
  question: string,
  topK = 3
): Promise<ChatSource[]> {
  const [vector] = await embedTexts([question], "query");
  const result = await getIndex().query({
    vector,
    topK: topK + 4,
    includeMetadata: true,
    filter: { type: { $eq: "chunk" } },
  });

  return (result.matches ?? [])
    .filter((m) => m.metadata?.type === "chunk" && typeof m.metadata.text === "string")
    .slice(0, topK)
    .map((m) => {
      const meta = m.metadata as Record<string, string | number>;
      const text = String(meta.text ?? "");
      return {
        documentId: String(meta.documentId ?? ""),
        filename: String(meta.filename ?? "SOP"),
        chunkIndex: Number(meta.chunkIndex ?? 0),
        preview: String(meta.preview ?? previewOf(text)),
        text,
        score: Number((m.score ?? 0).toFixed(3)),
      };
    });
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const index = getIndex();
  const ids: string[] = [];
  let paginationToken: string | undefined;

  do {
    const page = await index.listPaginated({
      prefix: "catalog#",
      limit: 100,
      paginationToken,
    });
    for (const vector of page.vectors ?? []) {
      if (vector.id) ids.push(vector.id);
    }
    paginationToken = page.pagination?.next;
  } while (paginationToken);

  if (!ids.length) return [];

  const documents: DocumentRecord[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const fetched = await index.fetch(ids.slice(i, i + 100));
    const records = fetched.records ?? {};
    for (const record of Object.values(records)) {
      const meta = (record.metadata ?? {}) as Record<string, string | number>;
      documents.push({
        id: String(meta.documentId ?? record.id?.replace("catalog#", "")),
        filename: String(meta.filename ?? "Untitled SOP"),
        mimeType: String(meta.mimeType ?? "text/plain"),
        uploadedAt: String(meta.uploadedAt ?? new Date().toISOString()),
        charCount: Number(meta.charCount ?? 0),
        chunkCount: Number(meta.chunkCount ?? 0),
      });
    }
  }

  return documents.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const index = getIndex();
  await index.deleteMany({ documentId });
  return true;
}
