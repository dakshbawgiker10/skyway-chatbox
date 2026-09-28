"use client";

import { DragEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Database,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { DocumentRecord } from "@/lib/types";

type UploadStage = "parsing" | "embedding" | "saved";

export function AdminPanel() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteName, setPasteName] = useState("ramp-sop.txt");
  const [pasteText, setPasteText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = (await res.json()) as { documents?: DocumentRecord[] };
    setDocuments(data.documents ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function uploadFile(file: File) {
    setUploading(true);
    setStage("parsing");
    setError(null);
    setStatus(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setStage("embedding");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as {
        error?: string;
        document?: DocumentRecord;
      };
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setStatus(
        `Successfully indexed: ${data.document?.filename}`
      );
      setStage("saved");
      await refresh();
    } catch (err) {
      setStage(null);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  async function onPaste(e: FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setUploading(true);
    setStage("parsing");
    setError(null);
    setStatus(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setStage("embedding");
      const form = new FormData();
      form.append("text", pasteText);
      form.append("filename", pasteName);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as {
        error?: string;
        document?: DocumentRecord;
      };
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setPasteText("");
      setStatus(
        `Successfully indexed: ${data.document?.filename}`
      );
      setStage("saved");
      await refresh();
    } catch (err) {
      setStage(null);
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  return (
    <div className="w-full space-y-5">
      {/* 1. DOCUMENT UPLOAD BOX (Slim horizontal bar taking whole line) */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-dashed transition-all duration-200 cursor-pointer ${
          dragging
            ? "border-purple-400 bg-purple-600/20 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            : "border-purple-500/25 bg-[#0e0a1a]/70 hover:border-purple-400/50 hover:bg-purple-950/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/30">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-white">
              Upload SOP Document
            </p>
            <p className="text-[11px] text-slate-400">
              Drag and drop or browse files (PDF, DOCX, TXT)
            </p>
          </div>
        </div>

        <span className="rounded-xl border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300">
          Browse
        </span>

        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {/* Upload Progress Tracker */}
      {stage && (
        <div className="rounded-xl border border-purple-500/25 bg-purple-950/20 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-2 font-semibold text-purple-200">
              {stage === "saved" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              )}
              {stage === "parsing"
                ? "Parsing document text…"
                : stage === "embedding"
                  ? "Generating vector embeddings…"
                  : "Synchronized to Pinecone!"}
            </span>
            <span className="text-purple-300 font-bold">
              {stage === "parsing" ? "33%" : stage === "embedding" ? "66%" : "100%"}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/60">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-300 ${
                stage === "parsing"
                  ? "w-1/3"
                  : stage === "embedding"
                    ? "w-2/3"
                    : "w-full"
              }`}
            />
          </div>
        </div>
      )}

      {/* 2. TWO TEXTBOXES: COMMIT NAME & ACTUAL TEXT FOR CONTEXT */}
      <form
        onSubmit={onPaste}
        className="w-full space-y-4 rounded-2xl border border-purple-500/20 bg-[#0e0a1a]/70 p-5 backdrop-blur-xl shadow-xl"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Commit Name
          </label>
          <input
            type="text"
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
            placeholder="e.g. ramp-shift-handover-sop.txt"
            className="mt-1.5 w-full rounded-xl border border-purple-500/25 bg-black/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-400/70 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Actual Text For Context
            </label>
            <span className="text-[10px] text-purple-300 font-mono">
              {pasteText.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder="Paste or write operational procedure text to embed into Pinecone..."
            className="mt-1.5 w-full resize-y rounded-xl border border-purple-500/25 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-purple-400/70 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] font-mono leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !pasteText.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Commit Context
        </button>
      </form>

      {/* 3. KNOWLEDGE VAULT AT THE LAST (Clean scroll container that NEVER overflows) */}
      <div className="w-full rounded-2xl border border-purple-500/20 bg-[#0e0a1a]/70 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400" />
            <h2 className="font-display text-sm font-semibold text-white">
              Knowledge Vault
            </h2>
            <span className="rounded-full border border-purple-500/20 bg-purple-950/40 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
              {documents.length} files
            </span>
          </div>

          {/* Quick search to easily navigate large collections */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by commit name…"
              className="w-full rounded-xl border border-purple-500/20 bg-black/60 pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none transition focus:border-purple-400/60 focus:shadow-[0_0_12px_rgba(168,85,247,0.2)] placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {status && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-3.5 py-2 text-xs text-emerald-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate">{status}</span>
          </div>
        )}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-950/30 px-3.5 py-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Contained Scrollable List (Ensures zero overflow even with 100+ files) */}
        <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2">
          {filteredDocs.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-purple-500/20 py-10 text-center">
              <p className="text-xs font-semibold text-slate-400">
                {searchQuery ? "No matching documents found" : "No documents indexed in Knowledge Vault"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Upload a document or commit context text above to get started.
              </p>
            </div>
          )}

          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center justify-between gap-3 rounded-xl border border-purple-500/15 bg-black/50 px-4 py-2.5 transition hover:border-purple-400/40 hover:bg-black/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-purple-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200 group-hover:text-purple-200">
                    {doc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {doc.chunkCount} chunks · {doc.charCount.toLocaleString()} chars · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void remove(doc.id)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/15 hover:text-red-400"
                aria-label={`Remove ${doc.filename}`}
                title="Remove from vault"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
