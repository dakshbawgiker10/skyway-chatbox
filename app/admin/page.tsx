import { AdminPanel } from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-white tracking-tight">
          Upload Context
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Upload SOP documents or commit custom context directly into the Pinecone vector database.
        </p>
      </div>
      <AdminPanel />
    </div>
  );
}
