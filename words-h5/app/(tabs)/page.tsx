import Link from 'next/link';
import { auth } from 'app/auth';
import { getBooks, getLatestProgress, type Book, type ProgressItem } from 'app/db';

export const dynamic = 'force-dynamic';

function BookCover({ book }: { book: Book }) {
  return book.coverUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={book.coverUrl} alt="" className="h-16 w-12 rounded object-cover" />
  ) : (
    <div className="flex h-16 w-12 items-center justify-center rounded bg-gradient-to-br from-sky-100 to-indigo-100 text-2xl">
      📖
    </div>
  );
}

function BookRow({ book, loggedIn }: { book: Book; loggedIn: boolean }) {
  const target = loggedIn ? `/book/${book.bookId}` : `/mine?auth=1&back=/book/${book.bookId}`;
  return (
    <Link href={target} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm active:bg-gray-50">
      <BookCover book={book} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{book.title}</p>
        <p className="mt-0.5 text-sm text-gray-500">共 {book.wordCount} 词</p>
      </div>
      <span className="text-gray-300">›</span>
    </Link>
  );
}

function LatestStudy({ latest }: { latest: ProgressItem }) {
  const percent = latest.wordCount > 0 ? Math.min(100, Math.round((latest.lastWordRank / latest.wordCount) * 100)) : 0;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-500">最近学习</h2>
      <Link href={`/study/${latest.bookId}`} className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-12 items-center justify-center rounded bg-gradient-to-br from-amber-100 to-orange-100 text-2xl">
            📕
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{latest.title}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              进度 {latest.lastWordRank}/{latest.wordCount}
            </p>
          </div>
        </div>
        <span className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white">
          继续学习
        </span>
      </Link>
    </section>
  );
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const [books, latest] = await Promise.all([
    getBooks(),
    userId ? getLatestProgress(userId) : Promise.resolve(undefined),
  ]);

  return (
    <main className="px-4 py-5">
      <h1 className="mb-4 text-xl font-bold text-gray-900">首页</h1>

      {latest && <div className="mb-6">
        <LatestStudy latest={latest} />
      </div>}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">全部单词书</h2>
        <div className="flex flex-col gap-3">
          {books.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
              暂无单词书
            </p>
          ) : (
            books.map((book) => <BookRow key={book.id} book={book} loggedIn={!!userId} />)
          )}
        </div>
      </section>
    </main>
  );
}
