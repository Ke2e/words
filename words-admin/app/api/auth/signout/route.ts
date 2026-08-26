import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

/** 退出登录 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
