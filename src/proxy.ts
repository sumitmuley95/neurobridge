import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIES, DASHBOARD_FOR, type SessionRole } from "@/lib/session";

// Which portal each URL prefix belongs to
const PORTALS: Record<string, SessionRole> = {
  "/student": "student",
  "/parent": "parent",
  "/teacher": "teacher",
  "/admin": "admin",
};

function loggedInRole(req: NextRequest): SessionRole | null {
  for (const role of Object.keys(SESSION_COOKIES) as SessionRole[]) {
    if (decodeSession(req.cookies.get(SESSION_COOKIES[role])?.value)) return role;
  }
  return null;
}

// Tell the browser never to store portal pages, so after logout the Back and
// Forward buttons have to ask the server again (and get sent to login).
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const prefix = Object.keys(PORTALS).find((p) => pathname === p || pathname.startsWith(p + "/"));

  // Login page: already signed in → go straight to your dashboard
  if (pathname === "/login") {
    const role = loggedInRole(req);
    if (role) return noStore(NextResponse.redirect(new URL(DASHBOARD_FOR[role], req.url)));
    return noStore(NextResponse.next());
  }

  if (!prefix) return NextResponse.next();

  const needed = PORTALS[prefix];
  const valid = decodeSession(req.cookies.get(SESSION_COOKIES[needed])?.value);
  if (!valid) {
    const role = loggedInRole(req);
    // Logged in as someone else → back to your own portal; otherwise → login
    const target = role ? DASHBOARD_FOR[role] : `/login?role=${needed}`;
    return noStore(NextResponse.redirect(new URL(target, req.url)));
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/login", "/student/:path*", "/parent/:path*", "/teacher/:path*", "/admin/:path*"],
};
