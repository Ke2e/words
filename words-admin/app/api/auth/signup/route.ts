import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema/admin";
import { createSession, hasAnyAdmin, toSafeUser } from "@/lib/auth";

/** 首个系统管理员注册：仅当 admin_users 表为空时允许 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "姓名、邮箱和密码均为必填项" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度至少为 6 位" }, { status: 400 });
    }

    // 已有管理员则禁止二次注册
    if (await hasAnyAdmin()) {
      return NextResponse.json(
        { error: "系统管理员已存在，不允许重复注册", code: "ADMIN_EXISTS" },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [admin] = await db
      .insert(adminUsers)
      .values({ name, email, passwordHash, role: "system_admin" })
      .returning();

    await createSession(admin.id);
    return NextResponse.json({ user: toSafeUser(admin) }, { status: 201 });
  } catch (err) {
    // 唯一约束冲突（邮箱重复）
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }
    console.error("signup error:", err);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}

export async function GET() {
  // 供前端探测注册页可用性
  const exists = await hasAnyAdmin();
  return NextResponse.json({ hasAnyAdmin: exists });
}
