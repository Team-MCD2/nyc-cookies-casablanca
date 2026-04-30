"use client";

import { UserProfile } from "@clerk/nextjs";

/**
 * Clerk's full-featured UserProfile widget. We strip its default card chrome
 * because we already render an outer page header — keeps a single visual
 * identity.
 */
export function ProfileEmbed() {
  return (
    <div className="rounded-lg border border-border bg-surface p-2 sm:p-4">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none border-0 w-full",
            navbar: "bg-transparent border-r border-border",
            scrollBox: "bg-transparent",
            pageScrollBox: "bg-transparent",
          },
        }}
      />
    </div>
  );
}
