"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import type { ChatSource } from "@/lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};

const FAQS = [
  {
    label: "Airport Pass Renewal",
    query: "What is the airport pass renewal procedure, turnaround time, and required forms?",
  },
  {
    label: "Shift Handover SOP",
    query: "What are the required steps and checklist protocols for a shift handover?",
  },
  {
    label: "Emergency Escalation",
    query: "Who is the primary lead for emergency escalation and what is the contact hierarchy?",
  },
  {
    label: "Ramp Safety & PPE",
    query: "What are the mandatory PPE items and safety protocols for ramp personnel?",
  },
  {
    label: "Ground Handling Rules",
    query: "What are the official ground safety rules and apron speed limits?",
  },
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function clearChat() {
    if (pending) return;
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Chat request failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sources: ChatSource[] = [];
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const type = event.match(/^event: (\w+)/)?.[1];
          const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
          if (!type || !dataLine) continue;
          const payload = JSON.parse(dataLine.slice(6)) as unknown;

          if (type === "sources") {
            sources = payload as ChatSource[];
          } else if (type === "token") {
            content += payload as string;
          } else if (type === "error") {
            const err = payload as { error?: string };
            throw new Error(err.error || "Stream error");
          }

          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId ? { ...msg, content, sources } : msg
            )
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reach the assistant.";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: message, error: true }
            : msg
        )
      );
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  async function copyMessage(message: Message) {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between max-w-4xl mx-auto py-2">
      {/* ZERO-STATE HERO (Matches Claude UI from screenshot) */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center my-auto px-4 py-8">
          {/* Claude-style Sunburst / Asterisk Icon + Editorial Headline */}
          <div className="flex items-center justify-center gap-3.5 mb-7">
            <svg
              className="h-8 w-8 text-purple-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.7)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l1.6 5.4L19 4l-3.4 5.4L21 12l-5.4 2.6L19 20l-5.4-3.4L12 22l-1.6-5.4L5 20l3.4-5.4L3 12l5.4-2.6L5 4l5.4 3.4L12 2z" />
            </svg>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#f5f5f7] tracking-tight">
              Hello, there!
            </h1>
          </div>

          {/* Central Claude-Style Input Container */}
          <div className="w-full max-w-2xl">
            <form onSubmit={onSubmit}>
              <div className="relative rounded-2xl border border-purple-500/25 bg-[#0e0a1a]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(168,85,247,0.12)] backdrop-blur-2xl transition-all duration-300 focus-within:border-purple-400/70 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.28)]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(input);
                    }
                  }}
                  rows={3}
                  placeholder="Type a question about airport operations, passes, or SOPs…"
                  className="w-full resize-none bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 outline-none leading-relaxed"
                />

                <div className="mt-3 flex items-center justify-between border-t border-purple-500/10 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
                      Chat
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs text-slate-500 font-medium">
                      Groq 70B · Fast
                    </span>
                    <button
                      type="submit"
                      disabled={pending || !input.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Send query"
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Row of FAQ Buttons (Replacing 'Write, Learn, Code, etc.') */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {FAQS.map((faq) => (
                <button
                  key={faq.label}
                  type="button"
                  onClick={() => void ask(faq.query)}
                  className="group flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-[#0d0918]/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-purple-400/60 hover:bg-purple-950/40 hover:text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                >
                  <Sparkles className="h-3 w-3 text-purple-400 transition-transform group-hover:scale-110" />
                  <span>{faq.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CONVERSATION THREAD */
        <div className="w-full flex-1 flex flex-col justify-between h-[calc(100vh-12rem)] min-h-[500px]">
          {/* Thread Header Toolbar */}
          <div className="flex items-center justify-between py-2 border-b border-purple-500/10 mb-4 px-2">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l1.6 5.4L19 4l-3.4 5.4L21 12l-5.4 2.6L19 20l-5.4-3.4L12 22l-1.6-5.4L5 20l3.4-5.4L3 12l5.4-2.6L5 4l5.4 3.4L12 2z" />
              </svg>
              <span className="font-serif text-lg text-white">SkyWay Chat</span>
            </div>

            <button
              type="button"
              onClick={clearChat}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-[#0f0b1a]/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-purple-400/50 hover:bg-purple-950/30 hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4 pr-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group relative max-w-[88%] sm:max-w-[80%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`transition-all duration-200 ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 px-4 py-3 text-sm font-medium text-white shadow-[0_0_16px_rgba(168,85,247,0.25)] border border-purple-400/30"
                        : msg.error
                          ? "rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-950/40 p-4 text-red-200 backdrop-blur-md"
                          : "rounded-2xl rounded-bl-sm border border-purple-500/20 bg-[#0e0a1a]/85 p-5 text-slate-200 shadow-xl backdrop-blur-md"
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <div className="ai-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )
                    ) : (
                      <div className="flex items-center gap-3 py-1 text-purple-300">
                        <span className="flex h-2 w-2 animate-bounce rounded-full bg-purple-400" />
                        <span className="flex h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:0.2s]" />
                        <span className="flex h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:0.4s]" />
                        <span className="text-xs font-medium text-purple-300/80 ml-1">
                          Retrieving SOP knowledge…
                        </span>
                      </div>
                    )}

                    {/* Sources Section */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t border-purple-500/15 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-300 mb-2">
                          Grounded Sources ({msg.sources.length})
                        </p>
                        <div className="flex items-center gap-2">
                          {msg.sources.map((source) => (
                            <details
                              key={`${source.documentId}-${source.chunkIndex}`}
                              className="group/source relative"
                            >
                              <summary
                                className="flex h-6 w-6 cursor-pointer list-none items-center justify-center rounded-md border border-purple-500/20 bg-purple-500/10 text-purple-300 transition hover:border-purple-400/60 hover:bg-purple-500/20"
                                title={`${source.filename} · chunk ${source.chunkIndex + 1}`}
                                aria-label={`View context from ${source.filename}, chunk ${source.chunkIndex + 1}`}
                              >
                                <FileText className="h-3 w-3" />
                              </summary>
                              <div className="absolute bottom-8 left-1/2 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-purple-500/20 bg-black p-2.5 text-[10px] leading-relaxed text-slate-300 shadow-2xl group-hover/source:block group-open/source:block">
                                <p className="mb-1 font-semibold text-purple-300">{source.filename} · chunk {source.chunkIndex + 1}</p>
                                <p className="line-clamp-5 font-mono">{source.preview}</p>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy Button */}
                  {msg.role === "assistant" && msg.content && !msg.error && (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyMessage(msg)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-purple-600/10 hover:text-purple-300"
                        aria-label="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Docked Claude-Style Input Container */}
          <div className="pt-3">
            <form onSubmit={onSubmit}>
              <div className="relative rounded-2xl border border-purple-500/25 bg-[#0e0a1a]/85 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.12)] backdrop-blur-2xl transition-all duration-300 focus-within:border-purple-400/70 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(input);
                    }
                  }}
                  rows={2}
                  placeholder="Ask a follow-up question…"
                  className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 outline-none leading-relaxed"
                />

                <div className="mt-2 flex items-center justify-between border-t border-purple-500/10 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-purple-500/30 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                      Chat
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
                      Groq 70B
                    </span>
                    <button
                      type="submit"
                      disabled={pending || !input.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
