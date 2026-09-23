"use client";

import { useEffect, useRef, useState } from "react";
import { googleClientId, googleSignIn, type User } from "@/lib/api";

type Gsi = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: Gsi;
  }
}

let loading: Promise<void> | null = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const sc = document.createElement("script");
    sc.src = "https://accounts.google.com/gsi/client";
    sc.async = true;
    sc.onload = () => resolve();
    sc.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(sc);
  });
  return loading;
}

/**
 * Google's own "Sign in with Google" button (their rules require their
 * button, not a lookalike). Renders nothing until the API says a client id
 * is set, so the page never shows a button that cannot work.
 */
export default function GoogleButton({
  mode,
  onUser,
  onError,
}: {
  mode: "login" | "register";
  onUser: (u: User) => void;
  onError: (msg: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ onUser, onError });
  cb.current = { onUser, onError };

  useEffect(() => {
    let alive = true;
    (async () => {
      const clientId = await googleClientId();
      if (!clientId || !alive) return;
      try {
        await loadGsi();
      } catch {
        return;
      }
      if (!alive || !box.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: "popup",
        callback: async ({ credential }: { credential: string }) => {
          try {
            cb.current.onUser(await googleSignIn(credential));
          } catch (e) {
            cb.current.onError(e instanceof Error ? e.message : "не вдалося увійти через Google");
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: mode === "register" ? "signup_with" : "signin_with",
        locale: "uk",
        width: Math.min(box.current.clientWidth || 320, 400),
      });
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [mode]);

  return <div ref={box} style={{ minHeight: ready ? 44 : 0, width: "100%", display: "flex", justifyContent: "center" }} />;
}
