"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/lib/auth-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin")
    }
  }, [user, isLoading, router])

  // 关键点：不等待加载完成，立即渲染布局
  // 已经登录的用户切换页面时，用户信息已经在 context 里了 → 没有停顿
  // 没登录的会在 useEffect 里跳转，所以也不会一直卡在这儿
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">Words Admin</span>
        </header>
        <div className="flex flex-1 flex-col p-4">{user ? children : null}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}