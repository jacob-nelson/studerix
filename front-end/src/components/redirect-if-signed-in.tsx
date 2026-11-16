"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAcademy } from "@/lib/store";

export function RedirectIfSignedIn() {
  const { ready, user } = useAcademy();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  return null;
}
