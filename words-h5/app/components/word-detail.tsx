import type { WordContent } from 'app/db';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

export function TransSection({ trans }: { trans: WordContent['trans'] }) {
  if (!trans?.length) return null;
  return (
    <Section title="释义">
      <ul className="flex flex-col gap-2 text-sm">
        {trans.map((t, i) => (
          <li key={i}>
            <p className="text-gray-800">{t.tranCn}</p>
            {t.tranOther && <p className="mt-0.5 text-gray-400">{t.tranOther}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function SentenceSection({ sentence }: { sentence: WordContent['sentence'] }) {
  const sentences = sentence?.sentences;
  if (!sentences?.length) return null;
  return (
    <Section title="例句">
      <ul className="flex flex-col gap-2 text-sm">
        {sentences.map((s, i) => (
          <li key={i}>
            <p className="text-gray-800">{s.sContent}</p>
            {s.sCn && <p className="mt-0.5 text-gray-400">{s.sCn}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function PhraseSection({ phrase }: { phrase: WordContent['phrase'] }) {
  const phrases = phrase?.phrases;
  if (!phrases?.length) return null;
  return (
    <Section title="短语">
      <ul className="flex flex-col gap-2 text-sm">
        {phrases.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-medium text-gray-800">{p.pContent}</span>
            <span className="text-gray-400">{p.pCn}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function SynoSection({ syno }: { syno: WordContent['syno'] }) {
  const synos = syno?.synos;
  if (!synos?.length) return null;
  return (
    <Section title="同近义词">
      <ul className="flex flex-col gap-2 text-sm">
        {synos.map((s, i) => (
          <li key={i}>
            <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {s.pos}
            </span>
            <span className="text-gray-400">{s.tran}</span>
            <p className="mt-1 text-gray-800">
              {s.hwds?.map((h) => h.w).filter(Boolean).join('、')}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function RelWordSection({ relWord }: { relWord: WordContent['relWord'] }) {
  const rels = relWord?.rels;
  if (!rels?.length) return null;
  return (
    <Section title="同根词">
      <ul className="flex flex-col gap-2 text-sm">
        {rels.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {r.pos}
            </span>
            <span className="text-gray-800">
              {r.words?.map((w) => `${w.hwd ?? ''}${w.tran ? ` ${w.tran}` : ''}`).join('；')}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function RemMethodSection({ remMethod }: { remMethod: WordContent['remMethod'] }) {
  if (!remMethod?.val) return null;
  return (
    <Section title="记忆方法">
      <div className="border-l-4 border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-gray-700">
        {remMethod.val}
      </div>
    </Section>
  );
}
