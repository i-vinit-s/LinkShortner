"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageSkeleton } from "@/components/LoadingSkeleton";

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
    return <PageSkeleton label="Checking administrator access" />;
  }

  return props.children;
}
