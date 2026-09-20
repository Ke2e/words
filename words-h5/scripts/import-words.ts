/**
 * 词书数据导入脚本（备用）
 *
 * 输入：words-admin/temp/*.json（NDJSON，每行一个单词对象）
 * 运行：npx tsx scripts/import-words.ts [输入目录]
 *
 * 幂等：books 按 book_id upsert；words 先按 bookId 删除再插入，可重复执行。
 * 数据源自开源词库（GitHub），书名映射在 TITLE_MAP 中人工维护。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import postgres from 'postgres';

const client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);

const TITLE_MAP: Record<string, string> = {
  PEPXiaoXue3_1: 'PEP三年级上册',
  PEPXiaoXue6_1: 'PEP六年级上册',
};

async function importFile(filePath: string) {
  const bookId = basename(filePath, '.json');
  const title = TITLE_MAP[bookId] ?? bookId;

  const lines = readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  let ok = 0;
  let fail = 0;
  const rows: { wordRank: number; headWord: string; content: unknown }[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      rows.push({
        wordRank: obj.wordRank,
        headWord: obj.headWord,
        content: obj.content?.word?.content ?? null, // 存 content.word.content 子对象
      });
      ok++;
    } catch {
      fail++;
      console.error(`[${bookId}] 第 ${i + 1} 行解析失败，已跳过`);
    }
  }

  // books upsert
  await client`
    INSERT INTO books (title, word_count, book_id)
    VALUES (${title}, ${ok}, ${bookId})
    ON CONFLICT (book_id) DO UPDATE
      SET title = EXCLUDED.title, word_count = EXCLUDED.word_count, updated_at = now();
  `;

  // words 先删后插，保证重跑幂等
  await client`DELETE FROM words WHERE "bookId" = ${bookId}`;
  if (rows.length > 0) {
    await client`
      INSERT INTO words ("wordRank", "headWord", content, "bookId")
      SELECT j->>'wordRank', j->>'headWord', j->'content', ${bookId}
      FROM ${client.json(rows as never)} AS j;
    `;
  }

  console.log(`[${bookId}] ${title}: 插入 ${ok} 条，失败 ${fail} 条`);
}

async function main() {
  const dir = resolve(process.argv[2] ?? '../words-admin/temp');
  if (!existsSync(dir)) {
    console.error(`输入目录不存在：${dir}`);
    console.error('用法：npx tsx scripts/import-words.ts [NDJSON 目录]');
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error(`目录中没有 .json 文件：${dir}`);
    process.exit(1);
  }

  for (const file of files) {
    await importFile(resolve(dir, file));
  }

  await client.end();
  console.log('导入完成');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
