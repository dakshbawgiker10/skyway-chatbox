import { NextResponse } from "next/server";
import { extractText, isAllowedFile } from "@/lib/parse";
import { upsertDocument } from "@/lib/knowledge";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const pastedText = form.get("text");
    const pastedName = form.get("filename");

    if (typeof pastedText === "string" && pastedText.trim()) {
      const filename =
        (typeof pastedName === "string" && pastedName.trim()) ||
        "pasted-sop.txt";
      const document = await upsertDocument({
        filename: filename.endsWith(".txt") ? filename : `${filename}.txt`,
        mimeType: "text/plain",
        text: pastedText,
      });
      return NextResponse.json({ ok: true, document });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a PDF, DOCX, or TXT file, or paste SOP text." },
        { status: 400 }
      );
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: "Only .pdf, .docx, and .txt files are supported." },
        { status: 400 }
      );
    }

    const text = await extractText(file);
    const document = await upsertDocument({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      text,
    });

    return NextResponse.json({ ok: true, document });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
