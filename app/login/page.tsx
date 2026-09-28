import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-purple-300">
          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          <span>Verifying security session…</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
