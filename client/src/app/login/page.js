"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-white/10 p-8 rounded-xl w-full max-w-sm space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Sign in
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Welcome back
          </h1>
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal transition-colors"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-text-muted text-center">
          No account?{" "}
          <a href="/signup" className="text-wire hover:underline">
            Create one
          </a>
        </p>
      </form>
    </div>
  );
}
