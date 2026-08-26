"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type AdminUser = {
  id: string
  name: string
  email: string
  role: "system_admin" | "admin"
  status: "enabled" | "disabled"
  createdAt: string
  updatedAt: string
}

type Role = "system_admin" | "admin"
type Status = "enabled" | "disabled"

const roleLabels: Record<Role, string> = {
  system_admin: "系统管理员",
  admin: "普通管理员",
}

const statusLabels: Record<Status, string> = {
  enabled: "启用",
  disabled: "已禁用",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export default function AdminUsersPage() {
  const { user: currentUser, isLoading: authLoading, refresh } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  // 新建对话框
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" as Role })

  // 编辑对话框
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "admin" as Role,
    status: "enabled" as Status,
    password: "",
  })

  // 删除确认
  const [deleting, setDeleting] = useState<AdminUser | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 普通管理员无权访问本页面
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "system_admin") {
      router.replace("/books")
    }
  }, [authLoading, currentUser, router])

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-users", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
    } catch {
      setError("加载管理员列表失败，请刷新重试")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && currentUser?.role === "system_admin") {
      loadUsers()
    }
  }, [authLoading, currentUser, loadUsers])

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [users, searchQuery]
  )

  const enabledSystemAdminCount = users.filter(
    (u) => u.role === "system_admin" && u.status === "enabled"
  ).length

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (createForm.password.length < 6) {
      setError("密码长度至少为 6 位")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "创建失败，请重试")
        return
      }
      setCreateOpen(false)
      setCreateForm({ name: "", email: "", password: "", role: "admin" })
      await loadUsers()
    } catch {
      setError("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError("")
    if (editForm.password && editForm.password.length < 6) {
      setError("新密码长度至少为 6 位")
      return
    }
    setIsSubmitting(true)
    try {
      const isSelf = editing.id === currentUser?.id
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
      }
      // 系统管理员不能修改自己的角色和状态
      if (!isSelf) {
        payload.role = editForm.role
        payload.status = editForm.status
      }
      if (editForm.password) payload.password = editForm.password

      const res = await fetch(`/api/admin-users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "更新失败，请重试")
        return
      }
      setEditing(null)
      await loadUsers()
      // 编辑的是当前登录用户：同步全局登录态（名称 / 邮箱 / 角色）
      if (isSelf) {
        await refresh()
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setError("")
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin-users/${deleting.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "删除失败，请重试")
        return
      }
      setDeleting(null)
      await loadUsers()
    } catch {
      setError("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEdit(user: AdminUser) {
    setError("")
    setEditing(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "",
    })
  }

  // 权限守卫渲染
  if (authLoading || isLoading || (currentUser && currentUser.role !== "system_admin")) {
    return null
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理员管理</h1>
          <p className="text-sm text-muted-foreground">管理系统中的所有管理员账号</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>添加管理员</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理员列表</CardTitle>
          <CardDescription>
            共 {filteredUsers.length} 个管理员（其中启用中的系统管理员 {enabledSystemAdminCount} 个）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Field>
              <FieldLabel htmlFor="search" className="sr-only">
                搜索
              </FieldLabel>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="搜索管理员姓名或邮箱..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Field>
          </div>

          {error && <FieldError className="mb-4 block">{error}</FieldError>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>管理员</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const initials = user.name.slice(0, 2).toUpperCase()
                const isSelf = user.id === currentUser.id
                // 最后一个启用中的系统管理员不可降级/禁用/删除
                const isLastEnabledSystemAdmin =
                  user.role === "system_admin" &&
                  user.status === "enabled" &&
                  enabledSystemAdminCount <= 1
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.name}
                          {isSelf && <span className="ml-1 text-xs text-muted-foreground">（我）</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "system_admin" ? "default" : "secondary"}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "enabled" ? "outline" : "destructive"}>
                        {statusLabels[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={isSelf || isLastEnabledSystemAdmin}
                        onClick={() => setDeleting(user)}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    没有找到匹配的管理员
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建管理员 */}
      <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加管理员</DialogTitle>
            <DialogDescription>创建一个新的管理员账号</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="create-name">姓名</FieldLabel>
                  <Input
                    id="create-name"
                    placeholder="张三"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-email">邮箱</FieldLabel>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-password">密码</FieldLabel>
                  <Input
                    id="create-password"
                    type="password"
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                  <FieldDescription>至少 6 位字符</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-role">角色</FieldLabel>
                  <Select
                    value={createForm.role}
                    onValueChange={(value) => setCreateForm({ ...createForm, role: value as Role })}
                  >
                    <SelectTrigger id="create-role" className="w-full">
                      <SelectValue>{roleLabels[createForm.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">普通管理员</SelectItem>
                      <SelectItem value="system_admin">系统管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>系统管理员可管理管理员账号</FieldDescription>
                </Field>
              </FieldGroup>
              {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑管理员 */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑管理员</DialogTitle>
            <DialogDescription>
              {editing?.id === currentUser?.id
                ? "修改自己的信息（姓名、邮箱、密码），角色和状态不可更改"
                : "修改管理员信息，留空密码表示不修改"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit-name">姓名</FieldLabel>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-email">邮箱</FieldLabel>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-password">新密码（可选）</FieldLabel>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="不修改请留空"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    autoComplete="new-password"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-role">角色</FieldLabel>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value as Role })}
                    disabled={editing?.id === currentUser?.id}
                  >
                    <SelectTrigger id="edit-role" className="w-full">
                      <SelectValue>{roleLabels[editForm.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">普通管理员</SelectItem>
                      <SelectItem value="system_admin">系统管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-status">状态</FieldLabel>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as Status })}
                    disabled={editing?.id === currentUser?.id}
                  >
                    <SelectTrigger id="edit-status" className="w-full">
                      <SelectValue>{statusLabels[editForm.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">启用</SelectItem>
                      <SelectItem value="disabled">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  {editing?.id !== currentUser?.id && (
                    <FieldDescription>禁用后该账号将无法登录，且立即下线</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
              {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除管理员</DialogTitle>
            <DialogDescription>
              确定要删除管理员「{deleting?.name}（{deleting?.email}）」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {error && <FieldError>{error}</FieldError>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
