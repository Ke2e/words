"use client"

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
  isSystemAdminExist: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_USER = "words_admin_user"
const STORAGE_KEY_ADMIN = "words_system_admin"

function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_USER)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY_USER)
      }
    }
    setIsLoading(false)
  }, [])

  const isSystemAdminExist =
    typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY_ADMIN)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN)
    if (!stored) return false

    try {
      const admin = JSON.parse(stored)
      if (admin.email === email && admin.password === password) {
        const userData: User = {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "system_admin",
        }
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))
        setUser(userData)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      if (isSystemAdminExist) return false

      const adminData = {
        id: generateId(),
        name,
        email,
        password,
        role: "system_admin",
      }
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminData))

      const userData: User = {
        id: adminData.id,
        name: adminData.name,
        email: adminData.email,
        role: "system_admin",
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))
      setUser(userData)
      return true
    },
    [isSystemAdminExist]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USER)
    setUser(null)
    router.push("/signin")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, isSystemAdminExist, login, signup, logout }}>
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