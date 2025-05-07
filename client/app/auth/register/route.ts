import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Redirect to Auth0 login with screen_hint=signup parameter
    return NextResponse.redirect(new URL("/auth/login?screen_hint=signup", req.url));
  } catch (error) {
    console.error("Error redirecting to Auth0 register:", error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
} 