import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { AdminUser } from "@/lib/db/schema/admin";

/**
 * 管理员管理接口的统一鉴权：仅系统管理员可调用。
 * 返回 null 表示通过，否则返回错误响应。
 */
export async function requireSystemAdmin(): Promise<
  { user: AdminUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (user.role !== "system_admin") {
    return { user: null, error: NextResponse.json({ error: "无权限，仅系统管理员可操作" }, { status: 403 }) };
  }
  return { user, error: null };
}
