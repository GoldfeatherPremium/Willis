"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AuthMode = "login" | "signup" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const googleEnabled = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || "google")
    .split(",")
    .map((s) => s.trim())
    .includes("google");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/app");
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/onboarding`
          }
        });
        if (error) throw error;
        setInfo(
          "Check your inbox to verify your email. Until then, you can explore the app with limited access."
        );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`
        });
        if (error) throw error;
        setInfo("If that email exists, a reset link is on its way.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setInfo("Password updated. You can now sign in.");
        router.push("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app/onboarding`
      }
    });
    if (error) setError(error.message);
  }

  const title =
    mode === "login" ? "Welcome back" :
    mode === "signup" ? "Create your account" :
    mode === "forgot" ? "Reset your password" : "Set a new password";

  return (
    <div className="w-full">
      <h1 className="font-display text-2xl font-bold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-secondary">
        {mode === "login" && "Sign in to open your HomeAtlas."}
        {mode === "signup" && "One home. Every belonging remembered."}
        {mode === "forgot" && "We'll email you a reset link."}
        {mode === "reset" && "Choose a strong new password."}
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error">
          {error}
        </div>
      )}
      {info && (
        <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft px-3.5 py-2.5 text-sm text-accent">
          {info}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {mode !== "forgot" && (
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        )}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          {mode === "login" ? "Sign in" :
           mode === "signup" ? "Create account" :
           mode === "forgot" ? "Send reset link" : "Update password"}
        </Button>
      </form>

      {googleEnabled && mode !== "forgot" && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-secondary">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.4 2.6.2.1c2.2-2 3.9-5 3.9-8.5z"/>
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.3 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.5 2.7-.1.1C3.6 21.3 7.5 24 12 24z"/>
              <path fill="#FBBC05" d="M5.2 14.4c-.3-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.9 8.2.3 10 .3 12s.6 3.8 1.6 5.5l3.3-3.1z"/>
              <path fill="#EA4335" d="M12 4.7c2.2 0 3.7 1 4.6 1.8l3.3-3.2C17.9 1.2 15.2 0 12 0 7.5 0 3.6 2.7 1.9 6.5l3.5 2.7c.9-2.9 3.6-4.5 6.6-4.5z"/>
            </svg>
            Continue with Google
          </Button>
        </>
      )}

      <div className="mt-6 text-center text-sm text-secondary">
        {mode === "login" && (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">Get started</Link>
            {" · "}
            <Link href="/forgot-password" className="font-medium text-accent hover:underline">Forgot password?</Link>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
          </>
        )}
        {mode === "forgot" && (
          <Link href="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
        )}
      </div>
    </div>
  );
}
