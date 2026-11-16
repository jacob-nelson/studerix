"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAcademy } from "@/lib/store";

export default function Home() {
  const { ready, user } = useAcademy();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/sign-in");
  }, [ready, user, router]);

  return (
    <div className="grid min-h-full place-items-center text-sm text-muted-foreground">
      Opening Tech Masters…
    </div>
  );
}
