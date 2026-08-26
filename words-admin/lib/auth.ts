import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSessions, adminUsers, type AdminUser } from "@/lib/db/schema/admin";

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/** 返回给前端的用户信息（不含密码哈希） */
export function toSafeUser(user: AdminUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** 创建 session 并写入 httpOnly cookie */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // 顺带清理已过期的 session
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  await db.insert(adminSessions).values({ token, userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

/** 获取当前登录用户（session 有效期内且账号未被禁用） */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0]?.user;
  // 账号被禁用：session 视为无效
  if (!user || user.status === "disabled") return null;

  return user;
}

/** 销毁当前 session */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** 数据表中是否已有管理员（用于判断首个系统管理员注册） */
export async function hasAnyAdmin(): Promise<boolean> {
  const rows = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  return rows.length > 0;
}

/** 启用中的系统管理员数量（用于保护最后一个可用的系统管理员） */
export async function countEnabledSystemAdmins(): Promise<number> {
  const rows = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "system_admin"), eq(adminUsers.status, "enabled")));
  return rows.length;
}

/** 删除指定用户的全部 session（账号被禁用时踢下线） */
export async function revokeUserSessions(userId: string) {
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}
