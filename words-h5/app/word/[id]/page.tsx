import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordById, unwrapContent } from 'app/db';
import {
  TransSection,
  SentenceSection,
  PhraseSection,
  SynoSection,
  RelWordSection,
  RemMethodSection,
} from 'app/components/word-detail';

export const dynamic = 'force-dynamic';

export default async function WordPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const word = await getWordById(id);
  if (!word) notFound();

  const c = unwrapContent(word.content);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-gray-50 pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link href={`/book/${word.bookId}`} className="text-xl leading-none text-gray-500">
          ←
        </Link>
        <h1 className="font-bold text-gray-900">单词详情</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        <section className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">{word.headWord}</h2>
          {(c?.ukphone || c?.usphone) && (
            <p className="mt-2 text-sm text-gray-400">
              {c?.ukphone && <span>英 /{c.ukphone}/</span>}
              {c?.usphone && <span className="ml-3">美 /{c.usphone}/</span>}
            </p>
          )}
        </section>

        <TransSection trans={c?.trans} />
        <SentenceSection sentence={c?.sentence} />
        <PhraseSection phrase={c?.phrase} />
        <SynoSection syno={c?.syno} />
        <RelWordSection relWord={c?.relWord} />
        <RemMethodSection remMethod={c?.remMethod} />
      </div>
    </main>
  );
}
