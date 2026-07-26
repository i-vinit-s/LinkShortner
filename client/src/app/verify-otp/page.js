"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function VerifyOtpForm() {
  var searchParams = useSearchParams();
  var emailFromUrl = searchParams.get("email") || "";

  var [otp, setOtp] = useState("");
  var [error, setError] = useState("");
  var [success, setSuccess] = useState("");
  var [loading, setLoading] = useState(false);
  var [cooldown, setCooldown] = useState(0);
  var authState = useAuth();
  var router = useRouter();

  useEffect(
    function () {
      if (cooldown <= 0) return;
      var timer = setInterval(function () {
        setCooldown(function (c) {
          return c - 1;
        });
      }, 1000);
      return function () {
        clearInterval(timer);
      };
    },
    [cooldown],
  );

  var handleVerify = async function (e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authState.verifyOtp(emailFromUrl, otp);
      router.push("/dashboard");
    } catch (err) {
      var msg = "Verification failed";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
        console.log(err);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  var handleResend = async function () {
    setError("");
    setSuccess("");
    try {
      await authState.resendOtp(emailFromUrl);
      setSuccess("A new code has been sent");
      setCooldown(60);
    } catch (err) {
      setError("Failed to resend code");
    }
  };

  return (
    <form
      onSubmit={handleVerify}
      className="bg-surface border border-white/10 p-8 rounded-xl w-full max-w-sm space-y-4"
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
          Verify email
        </p>
        <h1 className="text-2xl font-display font-bold text-white">
          Enter your code
        </h1>
        <p className="text-sm text-text-muted mt-2">
          We sent a 6-digit code to{" "}
          <span className="text-white">{emailFromUrl}</span>
        </p>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-led bg-led/10 border border-led/30 rounded-md px-3 py-2">
          {success}
        </p>
      ) : null}

      <input
        value={otp}
        onChange={function (e) {
          setOtp(e.target.value);
        }}
        placeholder="000000"
        maxLength={6}
        className="w-full bg-surface-raised border border-white/10 rounded-md px-3 py-2.5 text-white text-center text-2xl tracking-widest font-mono placeholder:text-text-muted focus:outline-none focus:border-signal"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-signal text-ink font-display font-medium rounded-md py-2.5 hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0}
        className="w-full text-sm text-wire hover:underline disabled:text-text-muted disabled:no-underline"
      >
        {cooldown > 0 ? "Resend code in " + cooldown + "s" : "Resend code"}
      </button>
    </form>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <Suspense
        fallback={<p className="text-text-muted text-sm">Loading...</p>}
      >
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
