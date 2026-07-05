import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Define protected route prefixes
  const protectedRoutes = ['/organizer', '/hiker'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // 1. Kick unauthenticated users out of protected routes
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // 2. Handle logged-in users
  if (user) {
    // Fetch the user's role from the database
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Normalize to lowercase to avoid case-sensitivity bugs (e.g., 'Organizer' vs 'organizer')
    const role = profile?.role?.toLowerCase();

    // Redirect logged-in users away from auth pages based on their role
    const authRoutes = ['/signin', '/signup', '/verify-email'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    
    if (isAuthRoute) {
      if (role === 'organizer') return NextResponse.redirect(new URL('/organizer', request.url));
      if (role === 'hiker') return NextResponse.redirect(new URL('/hiker', request.url));
      return NextResponse.redirect(new URL('/', request.url)); // Fallback if no role
    }

    // STRICT LOCK: If accessing /organizer paths, you MUST explicitly be an 'organizer'
    if (pathname.startsWith('/organizer') && role !== 'organizer') {
      return NextResponse.redirect(new URL('/hiker', request.url));
    }

    // STRICT LOCK: If accessing /hiker paths, you MUST explicitly be a 'hiker'
    if (pathname.startsWith('/hiker') && role !== 'hiker') {
      return NextResponse.redirect(new URL('/organizer', request.url));
    }
  }

  return supabaseResponse;
}

// CRITICAL SAFETY NET: Prevents middleware from running on images/css and crashing your DB
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};