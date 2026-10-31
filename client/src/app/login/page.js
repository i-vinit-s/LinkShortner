"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { AuthSkeleton } from "@/components/LoadingSkeleton";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError(
          "Too many attempts. Try again in " +
            err.response.data.retryAfter +
            "s",
        );
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.unverified
      ) {
        router.push(
          "/verify-otp?email=" + encodeURIComponent(err.response.data.email),
        );
      } else {
        var msg = "Login failed";
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return <AuthSkeleton label="Checking your session" />;
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] px-5 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8"
      >
        <div>
          <p className="mb-2 text-sm text-[#777777]">Your links are waiting.</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#9B9B9B]">Continue to your links, analytics, and bio pages.</p>
        </div>

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium text-white">Email<input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            className="ui-input focus-ring mt-2"
            required
          /></label>
          <label className="block text-sm font-medium text-white">Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={handleChange} className="ui-input focus-ring mt-2" required /></label>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="ui-button-primary focus-ring w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-text-muted text-center">
          No account?{" "}
          <Link href="/signup" className="text-wire hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
