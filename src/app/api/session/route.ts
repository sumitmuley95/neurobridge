import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIES, type SessionRole } from "@/lib/session";

// Tiny "am I still logged in?" check used by portal pages when they are
// shown again via the browser's Back/Forward buttons.
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  let role: SessionRole | null = null;
  for (const r of Object.keys(SESSION_COOKIES) as SessionRole[]) {
    if (decodeSession(cookieStore.get(SESSION_COOKIES[r])?.value)) {
      role = r;
      break;
    }
  }
  return Response.json({ role }, { headers: { "Cache-Control": "no-store" } });
}
