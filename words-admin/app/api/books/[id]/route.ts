import { NextRequest, NextResponse } from "next/server";
import { db, eq } from "@/lib/db";
import { books } from "@/lib/db/schema/books";
import { words } from "@/lib/db/schema/words";
import { requireSystemAdmin } from "@/lib/admin-guard";

/** 更新单词书 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const [target] = await db.select().from(books).where(eq(books.id, Number(id))).limit(1);
    if (!target) {
      return NextResponse.json({ error: "单词书不存在" }, { status: 404 });
    }

    const updates: Partial<typeof books.$inferInsert> = { updatedAt: new Date() };

    if (typeof body?.title === "string") {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
      updates.title = title;
    }

    if (typeof body?.wordCount === "number") {
      updates.wordCount = body.wordCount;
    }

    if (body?.coverUrl !== undefined) {
      updates.coverUrl = typeof body.coverUrl === "string" ? body.coverUrl.trim() || null : null;
    }

    if (typeof body?.bookId === "string") {
      const bookId = body.bookId.trim();
      if (!bookId) return NextResponse.json({ error: "bookId 不能为空" }, { status: 400 });
      // 检查 bookId 是否与其他记录重复
      if (bookId !== target.bookId) {
        const [dup] = await db
          .select({ id: books.id })
          .from(books)
          .where(eq(books.bookId, bookId))
          .limit(1);
        if (dup) {
          return NextResponse.json({ error: "该 bookId 已被其他单词书使用" }, { status: 409 });
        }
      }
      updates.bookId = bookId;
    }

    if (body?.tags !== undefined) {
      updates.tags = typeof body.tags === "string" ? body.tags.trim() || null : null;
    }

    const [updated] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, Number(id)))
      .returning();

    return NextResponse.json({ book: updated });
  } catch (err) {
    console.error("update book error:", err);
    return NextResponse.json({ error: "更新失败，请稍后重试" }, { status: 500 });
  }
}

/** 删除单词书（同时删除该 bookId 下所有单词） */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSystemAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    const [target] = await db.select().from(books).where(eq(books.id, Number(id))).limit(1);
    if (!target) {
      return NextResponse.json({ error: "单词书不存在" }, { status: 404 });
    }

    // 先删 words 表中该 bookId 下的所有单词，再删 books 记录
    await db.delete(words).where(eq(words.bookId, target.bookId));
    await db.delete(books).where(eq(books.id, Number(id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete book error:", err);
    return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 });
  }
}