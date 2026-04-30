import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

/**
 * Clerk middleware: gates /admin and /pro behind authentication only.
 *
 * Role-based redirects (admin-only / pro-only) are enforced inside the
 * (admin) and (pro) layouts via `requireRole()` (see src/lib/auth.ts), which
 * reads from publicMetadata directly — so it works whether or not Clerk's
 * "Customize session token" claim is configured.
 */
export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;
  const { userId, redirectToSignIn } = await auth();
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
