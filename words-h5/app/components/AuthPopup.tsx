'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form } from 'app/form';
import { SubmitButton } from 'app/submit-button';
import { loginAction, registerAction } from 'app/actions';

const errorMessages: Record<string, string> = {
  '1': '邮箱或密码错误',
  exists: '该邮箱已注册，请直接登录',
  invalid: '请输入正确的邮箱和密码',
};

export function AuthPopup({
  initialOpen,
  back,
  error,
}: {
  initialOpen: boolean;
  back?: string;
  error?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  function close() {
    setOpen(false);
    // 清理 URL 参数，刷新后不再自动弹出
    router.replace('/mine');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white active:opacity-80"
      >
        登录 / 注册
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex border-b border-gray-200">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-3 text-sm font-medium ${
                    mode === m
                      ? 'border-b-2 border-black text-black'
                      : 'text-gray-400'
                  }`}
                >
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            {error && (
              <p className="bg-red-50 px-4 py-2 text-center text-sm text-red-600">
                {errorMessages[error] ?? '操作失败，请重试'}
              </p>
            )}

            {mode === 'login' ? (
              <Form action={loginAction}>
                <input type="hidden" name="back" value={back ?? '/'} />
                <SubmitButton>登录</SubmitButton>
              </Form>
            ) : (
              <Form action={registerAction}>
                <input type="hidden" name="back" value={back ?? '/'} />
                <SubmitButton>注册并登录</SubmitButton>
              </Form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
