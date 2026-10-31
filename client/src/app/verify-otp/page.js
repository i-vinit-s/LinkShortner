"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthSkeleton } from "@/components/LoadingSkeleton";

function VerifyOtpForm() {
  var searchParams = useSearchParams();
  var emailFromUrl = searchParams.get("email") || "";

  var [otp, setOtp] = useState("");
  var [error, setError] = useState("");
  var [success, setSuccess] = useState("");
  var [loading, setLoading] = useState(false);
  var [resending, setResending] = useState(false);
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
    setResending(true);
    try {
      await authState.resendOtp(emailFromUrl);
      setSuccess("A new code has been sent");
      setCooldown(60);
    } catch (err) {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <form
      onSubmit={handleVerify}
      aria-busy={loading}
      className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl sm:p-8"
    >
      <div>
        <p className="mb-2 text-sm text-text-muted">One last step</p>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Verify your email</h1>
        <p className="text-sm text-text-muted mt-2">
          We sent a 6-digit code to{" "}
          <span className="text-white">{emailFromUrl}</span>
        </p>
      </div>

      {error ? (
        <p id="otp-error" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-led bg-led/10 border border-led/30 rounded-md px-3 py-2" role="status" aria-live="polite">
          {success}
        </p>
      ) : null}

      <label htmlFor="otp-code" className="sr-only">Six digit verification code</label><input
        id="otp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={function (e) {
          setOtp(e.target.value);
        }}
        placeholder="000000"
        maxLength={6}
        pattern="[0-9]{6}"
        aria-invalid={!!error}
        aria-describedby={error ? "otp-error" : undefined}
        className="ui-input focus-ring text-center text-2xl tracking-widest font-mono"
        required
      />

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="ui-button-primary focus-ring w-full"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        aria-busy={resending}
        className="w-full text-sm text-wire hover:underline disabled:text-text-muted disabled:no-underline"
      >
        {resending ? "Sending new code…" : cooldown > 0 ? "Resend code in " + cooldown + "s" : "Resend code"}
      </button>
    </form>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <Suspense
        fallback={<AuthSkeleton label="Loading email verification" />}
      >
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
