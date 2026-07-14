import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run the intl middleware first to handle locale routing
  const response = intlMiddleware(request);

  // Check if this is an admin route (any locale)
  const isAdminRoute = routing.locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/admin`) &&
      !pathname.startsWith(`/${locale}/admin/login`)
  );

  if (isAdminRoute) {
    // Refresh session and check auth ONLY on admin routes
    const { user } = await updateSession(request, response);

    if (!user) {
      // Detect locale from path
      const locale =
        routing.locales.find((l) => pathname.startsWith(`/${l}/`)) ||
        routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes, static files, images, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
