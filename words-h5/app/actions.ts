'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { signIn, signOut, auth } from 'app/auth';
import { getUser, createUser, upsertProgress, getBookByBookId } from 'app/db';

function backTo(formData: FormData): string {
  const back = String(formData.get('back') ?? '/');
  // 仅允许站内路径，防开放重定向
  return back.startsWith('/') && !back.startsWith('//') ? back : '/';
}

// 1) popup 登录
export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const back = backTo(formData);

  try {
    await signIn('credentials', { email, password, redirectTo: back });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(`/mine?auth=1&back=${encodeURIComponent(back)}&error=1`);
    }
    throw e; // redirect() 抛出的 NEXT_REDIRECT 必须继续抛出
  }
}

// 2) popup 注册（判重 → 建号 → 自动登录）
export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const back = backTo(formData);

  const invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length === 0;
  if (invalid) {
    redirect(`/mine?auth=1&back=${encodeURIComponent(back)}&error=invalid`);
  }

  const existing = await getUser(email);
  if (existing.length > 0) {
    redirect(`/mine?auth=1&back=${encodeURIComponent(back)}&error=exists`);
  }

  await createUser(email, password);

  try {
    await signIn('credentials', { email, password, redirectTo: back });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(`/mine?auth=1&back=${encodeURIComponent(back)}&error=1`);
    }
    throw e;
  }
}

// 3) 学习进度保存（学习页【下一个】触发）；userId 一律取 session，不接受客户端传入
export async function saveProgress(bookId: string, wordRank: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false }; // 未登录静默忽略（兜底防御）

  const book = await getBookByBookId(bookId);
  if (!book) return { ok: false }; // bookId 校验存在于 books

  await upsertProgress(userId, bookId, wordRank);
  return { ok: true };
}

// 4) 退出登录
export async function signOutAction() {
  await signOut({ redirectTo: '/mine' });
}
