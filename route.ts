import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ok:true, provider:process.env.AI_PROVIDER || "openai", policyVersion:process.env.POLICY_VERSION || "unset"});
}