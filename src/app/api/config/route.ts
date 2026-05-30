import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasSessionKey: !!process.env.WASENDER_SESSION_API_KEY,
    hasPAT: !!process.env.WASENDER_API_TOKEN,
  });
}
