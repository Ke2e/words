import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from 'app/auth';
import { getBookByBookId, getWordsByBookId, getProgress, type WordContent } from 'app/db';

export const dynamic = 'force-dynamic';

export default async function BookPage({
  params,
}: {
  params: { bookId: string };
}) {
  const book = await getBookByBookId(params.bookId);
  if (!book) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const [words, progress] = await Promise.all([
    getWordsByBookId(params.bookId),
    userId ? getProgress(userId, params.bookId) : Promise.resolve(undefined),
  ]);

  const hasProgress = !!progress && progress.lastWordRank > 0;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-gray-50 pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link href="/" className="text-xl leading-none text-gray-500">
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-bold text-gray-900">{book.title}</h1>
      </header>

      <div className="px-4 py-4">
        <Link
          href={`/study/${book.bookId}`}
          className="block rounded-xl bg-emerald-500 py-3 text-center text-sm font-medium text-white active:bg-emerald-600"
        >
          {hasProgress ? '继续学习' : '开始学习'}
        </Link>
      </div>

      <section className="px-4">
        {words.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            该书暂无单词
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            {words.map((word, index) => {
              const c = (word.content ?? null) as WordContent | null;
              const tranCn = c?.trans?.[0]?.tranCn ?? null;
              return (
                <Link
                  key={word.id}
                  href={`/word/${word.id}`}
                  className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 text-sm last:border-b-0 active:bg-gray-50"
                >
                  <span className="w-7 shrink-0 text-gray-400">{index + 1}</span>
                  <span className="font-medium text-gray-900">{word.headWord}</span>
                  <span className="min-w-0 flex-1 truncate text-gray-500">{tranCn}</span>
                  <span className="text-gray-300">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
