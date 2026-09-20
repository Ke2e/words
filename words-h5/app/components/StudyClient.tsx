'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProgress } from 'app/actions';
import type { StudyCard } from 'app/db';

export function StudyClient({
  bookId,
  cards,
  startIdx,
  finishedRound,
}: {
  bookId: string;
  cards: StudyCard[];
  startIdx: number;
  finishedRound: boolean;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(startIdx);
  const [saving, setSaving] = useState(false);

  const card = cards[idx];
  const isLast = idx >= cards.length - 1;

  if (!card) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        该书暂无单词
      </p>
    );
  }

  async function onNext() {
    if (isLast || saving) return;
    setSaving(true);
    try {
      const next = cards[idx + 1];
      await saveProgress(bookId, next.wordRank ?? 0);
      setIdx(idx + 1);
    } finally {
      setSaving(false);
    }
  }

  const example = card.sContent
    ? { content: card.sContent, cn: card.sCn }
    : card.pContent
      ? { content: card.pContent, cn: card.pCn }
      : null;

  return (
    <div className="flex flex-col gap-4">
      {finishedRound && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-600">
          已完成一轮，从头复习
        </p>
      )}

      <div
        onClick={() => router.push(`/word/${card.id}`)}
        className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
      >
        <h2 className="text-3xl font-bold text-gray-900">{card.headWord}</h2>
        {(card.usphone || card.ukphone) && (
          <p className="mt-2 text-sm text-gray-400">
            {card.ukphone && <span>英 /{card.ukphone}/</span>}
            {card.usphone && <span className="ml-3">美 /{card.usphone}/</span>}
          </p>
        )}
        {card.tranCn && <p className="mt-5 text-lg text-gray-800">{card.tranCn}</p>}
        {example && (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-700">{example.content}</p>
            {example.cn && <p className="mt-1 text-gray-400">{example.cn}</p>}
          </div>
        )}
        <p className="mt-6 text-xs text-gray-300">（点击卡片查看详情）</p>
      </div>

      <button
        onClick={onNext}
        disabled={isLast || saving}
        className={`rounded-xl py-3.5 text-sm font-medium text-white transition-all ${
          isLast
            ? 'bg-gray-300'
            : 'bg-black active:opacity-80 disabled:opacity-60'
        }`}
      >
        {isLast ? '已完成' : saving ? '保存中…' : '下一个 ▶'}
      </button>
    </div>
  );
}
