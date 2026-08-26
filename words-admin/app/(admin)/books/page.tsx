"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PlusIcon, SearchIcon } from "lucide-react"

type Book = {
  id: string
  name: string
  wordCount: number
  status: "published" | "draft"
  createdAt: string
}

const initialBooks: Book[] = [
  { id: "1", name: "CET-4 核心词汇", wordCount: 1200, status: "published", createdAt: "2026-01-15" },
  { id: "2", name: "CET-6 高频词汇", wordCount: 1500, status: "published", createdAt: "2026-02-20" },
  { id: "3", name: "考研英语词汇", wordCount: 2000, status: "draft", createdAt: "2026-03-10" },
  { id: "4", name: "雅思核心词汇", wordCount: 1800, status: "published", createdAt: "2026-04-05" },
  { id: "5", name: "托福必备词汇", wordCount: 1600, status: "draft", createdAt: "2026-05-18" },
]

export default function BooksPage() {
  const [books] = useState<Book[]>(initialBooks)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBooks = books.filter((book) => book.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">单词书管理</h1>
          <p className="text-sm text-muted-foreground">管理系统中的所有单词书</p>
        </div>
        <Button>
          <PlusIcon data-icon="inline-start" />
          新建单词书
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>单词书列表</CardTitle>
          <CardDescription>共 {filteredBooks.length} 本单词书</CardDescription>
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
                  placeholder="搜索单词书名称..."
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
                <TableHead>名称</TableHead>
                <TableHead>单词数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.name}</TableCell>
                  <TableCell>{book.wordCount} 词</TableCell>
                  <TableCell>
                    <Badge variant={book.status === "published" ? "default" : "secondary"}>
                      {book.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell>{book.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    没有找到匹配的单词书
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