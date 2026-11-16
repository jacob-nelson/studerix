"use client";

import { useEffect } from "react";

export function RegisterPWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install support is best-effort in this prototype.
    });
  }, []);
  return null;
}
