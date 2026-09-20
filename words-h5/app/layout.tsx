import './globals.css';

import { GeistSans } from 'geist/font/sans';

let title = '单词学习';
let description = '选择单词书，卡片式背单词，学习进度自动同步。';

export const metadata = {
  title,
  description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
