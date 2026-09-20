import Link from 'next/link';
import { auth } from 'app/auth';
import { getProgressList, type ProgressItem } from 'app/db';
import { signOutAction } from 'app/actions';
import { AuthPopup } from 'app/components/AuthPopup';

export const dynamic = 'force-dynamic';

function ProgressRow({ item }: { item: ProgressItem }) {
  const percent =
    item.wordCount > 0
      ? Math.min(100, Math.round((item.lastWordRank / item.wordCount) * 100))
      : 0;
  return (
    <Link
      href={`/study/${item.bookId}`}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm active:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{item.title}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          进度 {item.lastWordRank}/{item.wordCount}
        </p>
      </div>
      <span className="text-gray-300">›</span>
    </Link>
  );
}

export default async function MinePage({
  searchParams,
}: {
  searchParams: { auth?: string; back?: string; error?: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const list = userId ? await getProgressList(userId) : [];

  return (
    <main className="px-4 py-5">
      <h1 className="mb-4 text-xl font-bold text-gray-900">我的</h1>

      {userId ? (
        <>
          <section className="mb-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl">
              👤
            </div>
            <p className="min-w-0 flex-1 truncate text-sm text-gray-700">
              {session?.user?.email}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">学习进度</h2>
            <div className="flex flex-col gap-3">
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
                  还没有学习记录，去首页挑一本单词书吧
                </p>
              ) : (
                list.map((item) => <ProgressRow key={item.bookId} item={item} />)
              )}
            </div>
          </section>

          <form action={signOutAction} className="mt-8">
            <button
              type="submit"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-red-500 active:bg-gray-50"
            >
              退出登录
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-col items-center rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            <span className="text-4xl">👤</span>
            <p className="mt-3 text-sm text-gray-500">登录后可同步学习进度</p>
          </div>
          <AuthPopup
            initialOpen={searchParams.auth === '1'}
            back={searchParams.back}
            error={searchParams.error}
          />
          <p className="mt-4 text-center text-xs text-gray-400">
            <Link href="/" className="underline">
              先去首页逛逛
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
