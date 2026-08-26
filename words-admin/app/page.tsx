"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user, isLoading, hasAnyAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!hasAnyAdmin) {
      // 数据库无管理员：引导注册首个系统管理员
      router.replace("/signup")
    } else if (user) {
      router.replace("/books")
    } else {
      router.replace("/signin")
    }
  }, [user, isLoading, hasAnyAdmin, router])

  return null
}
