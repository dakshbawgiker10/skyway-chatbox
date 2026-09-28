export type DocumentRecord = {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  charCount: number;
  chunkCount: number;
};

export type ChunkRecord = {
  id: string;
  documentId: string;
  filename: string;
  index: number;
  text: string;
  preview: string;
};

export type ChatSource = {
  documentId: string;
  filename: string;
  chunkIndex: number;
  preview: string;
  text?: string;
  score: number;
};

export type RetrievedChunk = ChunkRecord & { score: number };
