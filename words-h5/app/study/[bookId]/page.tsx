import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from 'app/auth';
import {
  getBookByBookId,
  getWordsByBookId,
  getProgress,
  toStudyCard,
} from 'app/db';
import { StudyClient } from 'app/components/StudyClient';

export const dynamic = 'force-dynamic';

export default async function StudyPage({
  params,
}: {
  params: { bookId: string };
}) {
  const book = await getBookByBookId(params.bookId);
  if (!book) notFound();

  // 中间件已对 /study/* 设卡，这里兜底防御
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/mine?auth=1&back=/study/${params.bookId}`);

  const [words, progress] = await Promise.all([
    getWordsByBookId(params.bookId),
    getProgress(userId, params.bookId),
  ]);
  const cards = words.map(toStudyCard);

  // 定位起点：上次学习的下一个；wordRank → 下标映射（不假设 wordRank 连续）
  const idx =
    progress && progress.lastWordRank > 0
      ? cards.findIndex((c) => c.wordRank === progress.lastWordRank)
      : -1;
  let startIdx = idx >= 0 ? idx + 1 : 0;
  let finishedRound = false;
  if (cards.length > 0 && startIdx >= cards.length) {
    startIdx = 0; // 学完回绕，从头复习
    finishedRound = true;
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-gray-50 px-4 py-4">
      <header className="mb-5 flex items-center gap-2">
        <Link href={`/book/${book.bookId}`} className="text-xl leading-none text-gray-500">
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-bold text-gray-900">{book.title}</h1>
        <span className="text-sm text-gray-400">
          {Math.min(startIdx + 1, cards.length)}/{cards.length}
        </span>
      </header>

      <StudyClient
        bookId={book.bookId}
        cards={cards}
        startIdx={startIdx}
        finishedRound={finishedRound}
      />
    </main>
  );
}
