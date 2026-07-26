"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PasswordChecklist from "@/components/PasswordChecklist";

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
        className="bg-surface border border-white/10 p-8 rounded-xl w-full max-w-sm space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Sign up
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Create account
          </h1>
        </div>

        {error ? (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        ) : null}

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white placeholder:text-text-muted focus:outline-none focus:border-signal"
          required
        />

        {form.password ? (
          <div className="bg-surface-raised border border-white/10 rounded-md p-3">
            <PasswordChecklist password={form.password} />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-text-muted text-center">
          Already have an account?{" "}
          <a href="/login" className="text-wire hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
