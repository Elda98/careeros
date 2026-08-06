import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public per PRD §22 Screen Inventory (Sign Up, Log In, Account Recovery)
// plus the marketing site's own public surface: `/` is now the full
// marketing site (redirects signed-in visitors to /dashboard itself, see
// app/page.tsx), and /privacy, /terms are static legal pages linked from
// its footer — neither should require authentication to read.
// Everything else requires an authenticated identity (FR-AUTH-4).
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/privacy", "/terms"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
