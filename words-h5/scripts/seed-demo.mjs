/**
 * 造演示账号与学习进度（截图/演示用，可重复执行）
 * - words-h5 用户：demo@words.local（User 表）
 * - words-admin 系统管理员：demo-admin@words.local（admin_users 表，bcryptjs）
 * - 学习进度：PEPXiaoXue6_1 学到第 10 词
 */
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { createRequire } from 'node:module';

const require2 = createRequire(import.meta.url);
const bcryptjs = require2('../../words-admin/node_modules/bcryptjs');

const PASSWORD = 'demo123456';

const sql = postgres(`${process.env.POSTGRES_URL}?sslmode=require`);

(async () => {
  // 1. H5 用户
  await sql`CREATE TABLE IF NOT EXISTS "User" (id SERIAL PRIMARY KEY, email VARCHAR(64), password VARCHAR(64))`;
  const hash = hashSync(PASSWORD, genSaltSync(10));
  await sql`DELETE FROM "User" WHERE email = 'demo@words.local'`;
  const user = await sql`INSERT INTO "User" (email, password) VALUES ('demo@words.local', ${hash}) RETURNING id`;
  const userId = user[0].id;

  // 2. 管理端系统管理员
  const adminHash = bcryptjs.hashSync(PASSWORD, 10);
  await sql`
    INSERT INTO admin_users (name, email, password_hash, role, status)
    VALUES ('演示管理员', 'demo-admin@words.local', ${adminHash}, 'system_admin', 'enabled')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'system_admin', status = 'enabled';
  `;

  // 3. 学习进度
  await sql`
    INSERT INTO study_progress (user_id, book_id, last_word_rank)
    VALUES (${userId}, 'PEPXiaoXue6_1', 10)
    ON CONFLICT (user_id, book_id) DO UPDATE SET last_word_rank = 10, updated_at = now();
  `;

  console.log('✓ 演示账号就绪：h5=demo@words.local / admin=demo-admin@words.local，密码均为 demo123456');
  console.log(`✓ 学习进度：PEPXiaoXue6_1 → 第 10 词（user_id=${userId}）`);
  await sql.end();
})();
