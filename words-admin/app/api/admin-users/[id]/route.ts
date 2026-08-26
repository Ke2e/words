import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema/admin";
import {
  countEnabledSystemAdmins,
  revokeUserSessions,
  toSafeUser,
} from "@/lib/auth";
import { requireSystemAdmin } from "@/lib/admin-guard";

/** 编辑管理员（仅系统管理员）：姓名、邮箱、角色、状态、可选重置密码 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin-users/[id]">
) {
  const { user, error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);

    const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "管理员不存在" }, { status: 404 });
    }

    const isSelf = id === user.id;

    // 系统管理员不能修改自己的角色和状态
    if (isSelf && (body?.role !== undefined || body?.status !== undefined)) {
      return NextResponse.json(
        { error: "不能修改自己的角色或状态" },
        { status: 400 }
      );
    }

    const updates: Partial<typeof adminUsers.$inferInsert> = { updatedAt: new Date() };

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
      updates.name = name;
    }

    if (typeof body?.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
      }
      const [dup] = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(and(eq(adminUsers.email, email), ne(adminUsers.id, id)))
        .limit(1);
      if (dup) {
        return NextResponse.json({ error: "该邮箱已被其他管理员使用" }, { status: 409 });
      }
      updates.email = email;
    }

    if (body?.role === "system_admin" || body?.role === "admin") {
      // 防止把最后一个启用中的系统管理员降级
      if (target.role === "system_admin" && body.role === "admin") {
        const count = await countEnabledSystemAdmins();
        if (count <= 1) {
          return NextResponse.json(
            { error: "不能降级最后一个启用中的系统管理员" },
            { status: 400 }
          );
        }
      }
      updates.role = body.role;
    }

    if (body?.status === "enabled" || body?.status === "disabled") {
      // 防止禁用最后一个启用中的系统管理员
      if (body.status === "disabled" && target.role === "system_admin" && target.status === "enabled") {
        const count = await countEnabledSystemAdmins();
        if (count <= 1) {
          return NextResponse.json(
            { error: "不能禁用最后一个启用中的系统管理员" },
            { status: 400 }
          );
        }
      }
      updates.status = body.status;
    }

    if (typeof body?.password === "string" && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "密码长度至少为 6 位" }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const [updated] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();

    // 账号被禁用：立即踢下线（删除该用户全部 session）
    if (updates.status === "disabled") {
      await revokeUserSessions(id);
    }

    return NextResponse.json({ user: toSafeUser(updated) });
  } catch (err) {
    console.error("update admin error:", err);
    return NextResponse.json({ error: "更新失败，请稍后重试" }, { status: 500 });
  }
}

/** 删除管理员（仅系统管理员） */
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin-users/[id]">
) {
  const { user, error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const { id } = await ctx.params;

    if (id === user.id) {
      return NextResponse.json({ error: "不能删除当前登录的账号" }, { status: 400 });
    }

    const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "管理员不存在" }, { status: 404 });
    }

    // 防止删除最后一个启用中的系统管理员
    if (target.role === "system_admin" && target.status === "enabled") {
      const count = await countEnabledSystemAdmins();
      if (count <= 1) {
        return NextResponse.json(
          { error: "不能删除最后一个启用中的系统管理员" },
          { status: 400 }
        );
      }
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete admin error:", err);
    return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 });
  }
}
