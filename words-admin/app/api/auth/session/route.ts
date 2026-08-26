import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyAdmin, toSafeUser } from "@/lib/auth";

/** 获取当前登录用户 + 系统管理员是否存在 */
export async function GET() {
  try {
    const [user, hasAny] = await Promise.all([getCurrentUser(), hasAnyAdmin()]);
    return NextResponse.json({
      user: user ? toSafeUser(user) : null,
      hasAnyAdmin: hasAny,
    });
  } catch (err) {
    console.error("session error:", err);
    return NextResponse.json({ user: null, hasAnyAdmin: false });
  }
}
