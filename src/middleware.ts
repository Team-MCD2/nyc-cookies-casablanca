import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// IMPORTANT: do NOT use "/pro(.*)" — that pattern also matches "/pro-invite"
// (the public Clerk SignUp page used by invited pros). When that page is
// gated, invited pros are bounced to /login before they even have an account
// and Clerk replies "user not found". We split into the exact "/pro" route
// plus the "/pro/<sub>" subtree so /pro-invite stays public. Same logic for
// /admin in case future routes like /admin-something are ever added.
const isProtectedRoute = createRouteMatcher([
  "/admin",
  "/admin/(.*)",
  "/pro",
  "/pro/(.*)",
]);

/** Ancienne page clients B2C admin — redirigée vers la gestion pros. */
const isRetiredPublicRoute = createRouteMatcher([
  "/admin/customers",
  "/admin/customers/(.*)",
]);

/**
 * Clerk middleware: gates /admin and /pro behind authentication only.
 *
 * Role-based redirects (admin-only / pro-only) are enforced inside the
 * (admin) and (pro) layouts via `requireRole()` (see src/lib/auth.ts), which
 * reads from publicMetadata directly — so it works whether or not Clerk's
 * "Customize session token" claim is configured.
 */
function roleFromClaims(sessionClaims: unknown): string | null {
  const meta = (sessionClaims as { metadata?: { role?: unknown } } | undefined)?.metadata;
  return typeof meta?.role === "string" ? meta.role : null;
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (
    userId &&
    (url.pathname === "/login" ||
      url.pathname.startsWith("/login/") ||
      url.pathname === "/after-sign-in")
  ) {
    const role = roleFromClaims(sessionClaims);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (role === "pro") {
      return NextResponse.redirect(new URL("/pro/dashboard", req.url));
    }
  }

  if (isRetiredPublicRoute(req)) {
    if (url.pathname.startsWith("/admin/customers")) {
      return NextResponse.redirect(new URL("/admin/pros", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isProtectedRoute(req)) return;
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
});

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js|json|jpe?g|png|gif|webp|svg|ico|woff2?|ttf|otf)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
