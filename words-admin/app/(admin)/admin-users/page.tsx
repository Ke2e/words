"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Field, FieldLabel } from "@/components/ui/field"
import { SearchIcon } from "lucide-react"

type AdminUser = {
  id: string
  name: string
  email: string
  role: "system_admin" | "admin"
  createdAt: string
}

const initialUsers: AdminUser[] = [
  {
    id: "1",
    name: "系统管理员",
    email: "admin@example.com",
    role: "system_admin",
    createdAt: "2026-01-01",
  },
  {
    id: "2",
    name: "张三",
    email: "zhangsan@example.com",
    role: "admin",
    createdAt: "2026-03-15",
  },
  {
    id: "3",
    name: "李四",
    email: "lisi@example.com",
    role: "admin",
    createdAt: "2026-05-20",
  },
]

export default function AdminUsersPage() {
  const [users] = useState<AdminUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理员管理</h1>
          <p className="text-sm text-muted-foreground">管理系统中的所有管理员账号</p>
        </div>
        <Button>添加管理员</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理员列表</CardTitle>
          <CardDescription>共 {filteredUsers.length} 个管理员</CardDescription>
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>管理员</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const initials = user.name.slice(0, 2).toUpperCase()
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "system_admin" ? "default" : "secondary"}>
                        {user.role === "system_admin" ? "系统管理员" : "管理员"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={user.role === "system_admin"}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    没有找到匹配的管理员
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}