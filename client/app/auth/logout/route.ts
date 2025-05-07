import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const url = await auth0.getLogoutUrl();
  return NextResponse.redirect(url);
} 