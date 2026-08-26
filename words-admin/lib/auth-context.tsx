"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type User = {
  id: string
  name: string
  email: string
  role: "system_admin" | "admin"
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  /** 数据库中是否已有管理员（决定能否进入 /signup 注册首个系统管理员） */
  hasAnyAdmin: boolean
  /** 刷新登录态（编辑当前用户信息后调用） */
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" })
      const data = await res.json()
      setUser(data.user ?? null)
      setHasAnyAdmin(Boolean(data.hasAnyAdmin))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: data.error ?? "登录失败，请重试" }
      }
      setUser(data.user)
      setHasAnyAdmin(true)
      return { ok: true }
    } catch {
      return { ok: false, error: "网络错误，请重试" }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: data.error ?? "注册失败，请重试" }
      }
      setUser(data.user)
      setHasAnyAdmin(true)
      return { ok: true }
    } catch {
      return { ok: false, error: "网络错误，请重试" }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
    } catch {
      // 忽略网络错误，本地状态照常清理
    }
    setUser(null)
    router.push("/signin")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, hasAnyAdmin, refresh, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
