"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CookieLoadingOverlay } from "@/components/cookie-loading-overlay";

const MIN_VISIBLE_MS = 380;

function isInternalNav(href: string, pathname: string): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
    return false;
  if (href.startsWith("http") && !href.startsWith(window.location.origin)) return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.pathname !== pathname || url.search !== window.location.search;
  } catch {
    return false;
  }
}

export function CookieNavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const isFirstPath = useRef(true);

  const show = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    shownAt.current = Date.now();
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    const elapsed = Date.now() - shownAt.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, delay);
  }, []);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    show();
    hide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, show, hide]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !isInternalNav(href, pathname)) return;
      show();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, show]);

  return <CookieLoadingOverlay visible={visible} />;
}
