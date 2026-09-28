import { NextResponse } from "next/server";
import { deleteDocument, listDocuments } from "@/lib/knowledge";

export const runtime = "nodejs";

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({
    documents,
    documentCount: documents.length,
    chunkCount: documents.reduce((total, document) => total + document.chunkCount, 0),
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing document id." }, { status: 400 });
  }
  await deleteDocument(id);
  const documents = await listDocuments();
  return NextResponse.json({
    ok: true,
    documents,
    documentCount: documents.length,
    chunkCount: documents.reduce((total, document) => total + document.chunkCount, 0),
  });
}
