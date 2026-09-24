import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    if (request.nextUrl.pathname.startsWith('/crm')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (request.nextUrl.pathname.startsWith('/crm')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    if (request.nextUrl.pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/crm', request.url));
    }
  } catch {
    if (request.nextUrl.pathname.startsWith('/crm')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/crm/:path*', '/login'],
};
