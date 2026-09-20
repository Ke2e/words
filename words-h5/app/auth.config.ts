import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    // 中间件只对「必须登录」的路由设卡（/study/*），其余页面全部放行，
    // 登录门槛由页面 / 交互层控制（未登录点书 → /mine?auth=1&back=...）
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname, search } = nextUrl;

      if (pathname.startsWith('/study')) {
        if (isLoggedIn) return true;
        const loginUrl = new URL('/mine', nextUrl);
        loginUrl.searchParams.set('auth', '1');
        loginUrl.searchParams.set('back', pathname + search);
        return Response.redirect(loginUrl);
      }

      return true;
    },
    // session 透传 userId（User 表自增 id），供保存学习进度等场景使用
    jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).id = (user as unknown as { id?: number }).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = (token as Record<string, unknown>).id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
