"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RequireAdmin(props) {
  var authState = useAuth();
  var router = useRouter();

  useEffect(
    function () {
      if (!authState.loading) {
        if (!authState.user) {
          router.replace("/login");
        } else if (!authState.user.isAdmin) {
          router.replace("/dashboard");
        }
      }
    },
    [authState.loading, authState.user, router],
  );

  if (authState.loading || !authState.user || !authState.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return props.children;
}
