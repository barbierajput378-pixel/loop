"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useActionState, useEffect } from "react";
import { Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { registerUser, type RegisterState } from "@/app/actions/auth";

const initial: RegisterState = { ok: false };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regState, regAction, regPending] = useActionState(registerUser, initial);

  // After successful registration, sign the user straight in.
  useEffect(() => {
    if (mode === "register" && regState.ok) {
      signIn("credentials", { email, password, redirect: false }).then((res) => {
        if (res?.ok) router.push(callbackUrl);
        else router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      });
    }
  }, [regState, mode, email, password, callbackUrl, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push(callbackUrl);
    else setError("Invalid email or password.");
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "login"
            ? "Sign in to vote and share feedback."
            : "Join to post ideas and shape the roadmap."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signIn("github", { callbackUrl })}
      >
        <Github size={18} /> Continue with GitHub
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" /> or {mode === "login" ? "with email" : "sign up with email"}{" "}
        <span className="h-px flex-1 bg-border" />
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
          </Button>
        </form>
      ) : (
        <form action={regAction} className="space-y-3">
          <Field label="Name">
            <input name="name" required className="input" placeholder="Ada Lovelace" autoComplete="name" />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {regState.error && <p className="text-sm text-danger">{regState.error}</p>}
          <Button type="submit" className="w-full" disabled={regPending}>
            {regPending ? <Loader2 size={18} className="animate-spin" /> : "Create account"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--surface));padding:0.625rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--brand))}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
