import { NextRequest, NextResponse } from "next/server";
import { asc, db, eq } from "@/lib/db";
import { books } from "@/lib/db/schema/books";
import { requireSystemAdmin } from "@/lib/admin-guard";

/** 获取单词书列表 */
export async function GET() {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  const list = await db.select().from(books).orderBy(asc(books.createdAt));
  return NextResponse.json({ books: list });
}

/** 新建单词书 */
export async function POST(request: NextRequest) {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const wordCount = typeof body?.wordCount === "number" ? body.wordCount : 0;
    const coverUrl = typeof body?.coverUrl === "string" ? body.coverUrl.trim() || null : null;
    const bookId = typeof body?.bookId === "string" ? body.bookId.trim() : "";
    const tags = typeof body?.tags === "string" ? body.tags.trim() || null : null;

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!bookId) {
      return NextResponse.json({ error: "bookId 不能为空" }, { status: 400 });
    }

    // 检查 bookId 是否重复
    const [existing] = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.bookId, bookId))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "该 bookId 已存在" }, { status: 409 });
    }

    const [book] = await db
      .insert(books)
      .values({ title, wordCount, coverUrl, bookId, tags })
      .returning();

    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    console.error("create book error:", err);
    return NextResponse.json({ error: "创建失败，请稍后重试" }, { status: 500 });
  }
}
