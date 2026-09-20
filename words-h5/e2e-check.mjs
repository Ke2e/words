/**
 * H5 端登录态联调验收脚本（对照 proposal 第 9 节）
 * 运行：node e2e-check.mjs
 * 1) 造测试用户 → NextAuth credentials 登录拿 session cookie
 * 2) 登录态访问首页/书页/学习页/我的/单词详情
 * 3) 写入学习进度 → 验证 /study 起点定位与 /mine 进度列表
 */
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

const BASE = 'http://localhost:3000';
const EMAIL = 'e2e-test@words.local';
const PASSWORD = 'e2e-test-1234';
const BOOK = 'PEPXiaoXue6_1';

const sql = postgres(`${process.env.POSTGRES_URL}?sslmode=require`);

function getCookie(res, name) {
  const cookies = res.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    if (k.trim() === name) return `${k}=${v}`;
  }
  return null;
}

async function main() {
  // 1. 造测试用户（幂等；User 表首次登录前可能还不存在，先兜底建表）
  await sql`CREATE TABLE IF NOT EXISTS "User" (id SERIAL PRIMARY KEY, email VARCHAR(64), password VARCHAR(64))`;
  const hash = hashSync(PASSWORD, genSaltSync(10));
  await sql`DELETE FROM "User" WHERE email = ${EMAIL}`;
  await sql`INSERT INTO "User" (email, password) VALUES (${EMAIL}, ${hash})`;
  console.log('✓ 测试用户已准备:', EMAIL);

  // 2. NextAuth 登录流程
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookie = getCookie(csrfRes, 'authjs.csrf-token');

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email: EMAIL,
      password: PASSWORD,
      callbackUrl: `${BASE}/`,
    }),
    redirect: 'manual',
  });
  const sessionCookie =
    getCookie(loginRes, 'authjs.session-token') ??
    getCookie(loginRes, '__Secure-authjs.session-token');
  if (!sessionCookie) {
    console.error('✗ 登录失败，未获得 session cookie，HTTP', loginRes.status);
    process.exit(1);
  }
  console.log('✓ 登录成功，HTTP', loginRes.status);

  const cookieHeader = `${csrfCookie}; ${sessionCookie}`;

  // 3. 验证 session API 透传 userId
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const session = await sessionRes.json();
  console.log(
    session?.user?.id ? `✓ session 透传 userId = ${session.user.id}` : '✗ session 未透传 userId',
  );

  // 4. 登录态访问各页面
  for (const path of ['/', `/book/${BOOK}`, `/study/${BOOK}`, '/mine']) {
    const r = await fetch(`${BASE}${path}`, { headers: { Cookie: cookieHeader } });
    console.log(`${r.status === 200 ? '✓' : '✗'} ${path} → ${r.status}`);
  }

  // 5. 写入进度（模拟点击【下一个】保存到第 5 词）→ 验证 /mine 列表与 /study 起点
  const bookRow = await sql`select id from books where book_id = ${BOOK} limit 1`;
  const wordRows = await sql`select "wordRank" from words where "bookId" = ${BOOK} order by "wordRank" asc nulls last, id asc`;
  const savedRank = wordRows[4].wordRank; // 第 5 个词
  await sql`
    INSERT INTO study_progress (user_id, book_id, last_word_rank)
    VALUES (${session.user.id}, ${BOOK}, ${savedRank})
    ON CONFLICT (user_id, book_id) DO UPDATE SET last_word_rank = ${savedRank}, updated_at = now();
  `;
  console.log(`✓ 已写入进度: ${BOOK} last_word_rank = ${savedRank}（第 5 词）`);

  const mineRes = await fetch(`${BASE}/mine`, { headers: { Cookie: cookieHeader } });
  const mineHtml = await mineRes.text();
  // React SSR 会在 JSX 文本插值间插入 <!-- --> 注释分隔符，先剔除再断言
  const strip = (html) => html.replace(/<!--.*?-->/g, '');
  console.log(
    strip(mineHtml).includes('进度 5/130') ? '✓ /mine 显示进度 5/130' : '✗ /mine 未显示预期进度',
  );
  console.log(mineHtml.includes(EMAIL) ? '✓ /mine 显示登录邮箱' : '✗ /mine 未显示邮箱');

  const studyHtml = await (
    await fetch(`${BASE}/study/${BOOK}`, { headers: { Cookie: cookieHeader } })
  ).text();
  // 起点 = 第 5 词的下一张 → 顶部计数应为 6/130
  console.log(
    strip(studyHtml).includes('6/130')
      ? '✓ /study 起点定位到第 6 张（刷新恢复）'
      : '✗ /study 起点定位失败',
  );

  // 6. 学习进度回绕：进度=最后一词 → 起点回绕第 1 张
  const lastRank = wordRows[wordRows.length - 1].wordRank;
  await sql`
    INSERT INTO study_progress (user_id, book_id, last_word_rank)
    VALUES (${session.user.id}, ${BOOK}, ${lastRank})
    ON CONFLICT (user_id, book_id) DO UPDATE SET last_word_rank = ${lastRank}, updated_at = now();
  `;
  const studyHtml2 = await (
    await fetch(`${BASE}/study/${BOOK}`, { headers: { Cookie: cookieHeader } })
  ).text();
  console.log(
    studyHtml2.includes('已完成一轮') ? '✓ 学完回绕提示渲染' : '✗ 学完回绕提示缺失',
  );

  // 7. 单词详情页
  const wordId = await sql`select id from words where "bookId" = ${BOOK} order by "wordRank" asc nulls last, id asc limit 1`;
  const wordHtml = await (
    await fetch(`${BASE}/word/${wordId[0].id}`, { headers: { Cookie: cookieHeader } })
  ).text();
  console.log(
    wordHtml.includes('单词详情') ? '✓ /word/[id] 渲染' : '✗ /word/[id] 渲染失败',
  );

  // 8. 清理：删除测试用户与进度
  await sql`DELETE FROM study_progress WHERE user_id = ${session.user.id}`;
  await sql`DELETE FROM "User" WHERE email = ${EMAIL}`;
  console.log('✓ 测试数据已清理');
  await sql.end();
}

main().catch((e) => {
  console.error('验收中断:', e.message);
  process.exit(1);
});
