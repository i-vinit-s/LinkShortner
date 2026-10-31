"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PasswordChecklist from "@/components/PasswordChecklist";
import Link from "next/link";
import { AuthSkeleton } from "@/components/LoadingSkeleton";

export default function SignupPage() {
  var [form, setForm] = useState({ name: "", email: "", password: "" });
  var [error, setError] = useState("");
  var [loading, setLoading] = useState(false);
  var authState = useAuth();
  var router = useRouter();

  useEffect(
    function () {
      if (!authState.loading && authState.user) {
        router.replace("/dashboard");
      }
    },
    [authState.loading, authState.user, router],
  );

  var handleChange = function (e) {
    setForm(function (prev) {
      var next = Object.assign({}, prev);
      next[e.target.name] = e.target.value;
      return next;
    });
  };

  var handleSubmit = async function (e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      var result = await authState.signup(form.name, form.email, form.password);
      router.push("/verify-otp?email=" + encodeURIComponent(result.email));
    } catch (err) {
      var msg = "Signup failed";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authState.loading || authState.user) {
    return <AuthSkeleton label="Checking your session" />;
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] px-5 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8"
      >
        <div>
          <p className="mb-2 text-sm text-[#777777]">A clearer home for every link.</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-[#9B9B9B]">Save links permanently and unlock the full workspace.</p>
        </div>

        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <label className="block text-sm font-medium text-white">Name<input name="name" autoComplete="name" placeholder="Your name" value={form.name} onChange={handleChange} className="ui-input focus-ring mt-2" required /></label>
        <label className="block text-sm font-medium text-white">Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className="ui-input focus-ring mt-2" required /></label>
        <label className="block text-sm font-medium text-white">Password<input name="password" type="password" autoComplete="new-password" placeholder="Create a strong password" value={form.password} onChange={handleChange} className="ui-input focus-ring mt-2" required /></label>

        {form.password ? (
          <div className="rounded-lg border border-white/10 bg-[#1F1F1F] p-3">
            <PasswordChecklist password={form.password} />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="ui-button-primary focus-ring w-full"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-text-muted text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-wire hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
