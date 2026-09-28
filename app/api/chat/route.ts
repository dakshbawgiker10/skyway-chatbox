import { NextResponse } from "next/server";
import { GROQ_MODEL, SYSTEM_PROMPT, getGroqClient } from "@/lib/groq";
import { listDocuments, queryRelevantChunks } from "@/lib/knowledge";
import type { ChatSource } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const documents = await listDocuments();
    if (!documents.length) {
      return NextResponse.json(
        {
          error:
            "No SOPs are loaded yet. Ask an admin to upload documents on the Knowledge Base page.",
        },
        { status: 400 }
      );
    }

    const matches = await queryRelevantChunks(question, 5);
    const sources: ChatSource[] = matches.map((m) => ({
      documentId: m.documentId,
      filename: m.filename,
      chunkIndex: m.chunkIndex,
      preview: m.preview,
      score: Number(m.score.toFixed(3)),
    }));

    const context = matches.length
      ? matches
          .map(
            (m, i) =>
              `[Source ${i + 1}: ${m.filename} · section ${m.chunkIndex + 1}]\n${m.text ?? ""}`
          )
          .join("\n\n---\n\n")
      : "(No matching SOP sections were found for this question.)";

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 900,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Operational context:\n${context}\n\nEmployee question:\n${question}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const meta = `event: sources\ndata: ${JSON.stringify(sources)}\n\n`;
        controller.enqueue(encoder.encode(meta));

        try {
          for await (const chunk of completion) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) {
              controller.enqueue(
                encoder.encode(`event: token\ndata: ${JSON.stringify(token)}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Groq request failed.";
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Chat request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
