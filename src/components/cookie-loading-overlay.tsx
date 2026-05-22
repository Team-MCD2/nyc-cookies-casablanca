"use client";

import Image from "next/image";

interface CookieLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function CookieLoadingOverlay({
  visible,
  message = "Chargement…",
}: CookieLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="cookie-loader-overlay fixed inset-0 z-[200] flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div className="cookie-loader-spin relative h-20 w-20">
          <Image
            src="/nyclogo.png"
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
            priority
          />
        </div>
        <p className="max-w-xs font-display text-[1.1rem] uppercase tracking-[0.2em] text-accent animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
