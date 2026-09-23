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
  const [clientId, setClientId] = useState<string | null>(null);
  const cb = useRef({ onUser, onError });
  cb.current = { onUser, onError };

  // 1: is Google configured at all, and is its script here
  useEffect(() => {
    let alive = true;
    googleClientId().then(async (id) => {
      if (!id) return;
      try {
        await loadGsi();
        if (alive) setClientId(id);
      } catch {
        /* blocked or offline: the email form still works */
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // 2: only then is the box on the page, visible and measurable, to draw into
  useEffect(() => {
    if (!clientId || !box.current || !window.google) return;
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
    box.current.innerHTML = "";
    window.google.accounts.id.renderButton(box.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: mode === "register" ? "signup_with" : "signin_with",
      locale: "uk",
      width: Math.min(box.current.clientWidth || 320, 400),
    });
  }, [clientId, mode]);

  if (!clientId) return null;
  // colorScheme light: the site runs color-scheme dark, and a frame whose
  // scheme differs from its host's gets an opaque white backdrop painted
  // under it, a white box around Google's dark pill
  return (
    <div
      ref={box}
      style={{ minHeight: 44, width: "100%", display: "flex", justifyContent: "center", colorScheme: "light" }}
    />
  );
}
