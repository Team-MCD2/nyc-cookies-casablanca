import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/pro(.*)"]);

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
