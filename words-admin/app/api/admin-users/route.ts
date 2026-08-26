import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema/admin";
import { toSafeUser } from "@/lib/auth";
import { requireSystemAdmin } from "@/lib/admin-guard";

/** 管理员列表（仅系统管理员） */
export async function GET() {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  const users = await db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
  return NextResponse.json({ users: users.map(toSafeUser) });
}

/** 新建管理员（仅系统管理员） */
export async function POST(request: NextRequest) {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = body?.role === "system_admin" ? "system_admin" : "admin";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "姓名、邮箱和密码均为必填项" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度至少为 6 位" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [admin] = await db
      .insert(adminUsers)
      .values({ name, email, passwordHash, role })
      .returning();

    return NextResponse.json({ user: toSafeUser(admin) }, { status: 201 });
  } catch (err) {
    console.error("create admin error:", err);
    return NextResponse.json({ error: "创建失败，请稍后重试" }, { status: 500 });
  }
}
