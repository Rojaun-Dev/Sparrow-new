import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await auth0.handleCallback(req);
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
} 