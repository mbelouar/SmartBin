import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)', 
  '/api/webhooks/clerk(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  // Get auth state
  const { userId } = await auth();
  
  // If user is authenticated and trying to access sign-in/sign-up, redirect to dashboard
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Allow public routes without any checks
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // If not authenticated and trying to access protected routes, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    // Only add redirect_url if it's not already the dashboard (to avoid loops)
    if (pathname !== '/dashboard' && pathname !== '/admin') {
      signInUrl.searchParams.set('redirect_url', pathname);
    }
    return NextResponse.redirect(signInUrl);
  }
  
  // Note: Admin route protection is handled in the admin page component
  // Middleware can't easily check user metadata, so we let the page handle it
  
  // Allow authenticated users to access protected routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
