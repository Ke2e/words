"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImageIcon, PlusIcon, SearchIcon } from "lucide-react"

type Book = {
  id: number
  title: string
  wordCount: number
  coverUrl: string | null
  bookId: string
  tags: string | null
  createdAt: string
  updatedAt: string
}

type BookForm = {
  title: string
  wordCount: number
  coverUrl: string
  bookId: string
  tags: string
}

const emptyForm = (): BookForm => ({
  title: "",
  wordCount: 0,
  coverUrl: "",
  bookId: "",
  tags: "",
})

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<BookForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // 加载列表
  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books")
      const data = await res.json()
      if (data.books) setBooks(data.books)
    } catch (err) {
      console.error("fetch books error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // 搜索过滤
  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(q) ||
      book.bookId.toLowerCase().includes(q)
    )
  })

  // 打开新增弹窗
  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm())
    setError("")
    setDialogOpen(true)
  }

  // 打开编辑弹窗
  const openEdit = (book: Book) => {
    setEditId(book.id)
    setForm({
      title: book.title,
      wordCount: book.wordCount,
      coverUrl: book.coverUrl ?? "",
      bookId: book.bookId,
      tags: book.tags ?? "",
    })
    setError("")
    setDialogOpen(true)
  }

  // 保存（新增/编辑）
  const handleSave = async () => {
    setError("")
    if (!form.title.trim()) {
      setError("标题不能为空")
      return
    }
    if (!form.bookId.trim()) {
      setError("bookId 不能为空")
      return
    }

    setSaving(true)
    try {
      const url = editId ? `/api/books/${editId}` : "/api/books"
      const method = editId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          wordCount: form.wordCount,
          coverUrl: form.coverUrl.trim(),
          bookId: form.bookId.trim(),
          tags: form.tags.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "操作失败")
        return
      }

      setDialogOpen(false)
      fetchBooks()
    } catch (err) {
      setError("网络错误，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  // 删除
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return

    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "删除失败")
        return
      }
      fetchBooks()
    } catch (err) {
      alert("网络错误，请稍后重试")
    }
  }

  // 封面占位
  const CoverImage = ({ url, title }: { url: string | null; title: string }) => {
    if (url) {
      return (
        <img
          src={url}
          alt={title}
          className="size-10 rounded object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none"
            ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
          }}
        />
      )
    }
    return (
      <div className="flex size-10 items-center justify-center rounded bg-muted">
        <ImageIcon className="size-5 text-muted-foreground" />
      </div>
    )
  }

  // 标签渲染
  const TagList = ({ tags }: { tags: string | null }) => {
    if (!tags) return null
    const list = tags.split(",").map((t) => t.trim()).filter(Boolean)
    if (list.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">单词书管理</h1>
          <p className="text-sm text-muted-foreground">管理系统中的所有单词书</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openAdd} />}>
            <PlusIcon data-icon="inline-start" />
            新建单词书
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "编辑单词书" : "新建单词书"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>标题</FieldLabel>
                <Input
                  placeholder="例如：PEP 小学英语三年级上"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>单词数量</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder="例如：300"
                  value={form.wordCount}
                  onChange={(e) => setForm({ ...form, wordCount: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field>
                <FieldLabel>封面 URL</FieldLabel>
                <Input
                  placeholder="可选，图片链接"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>bookId</FieldLabel>
                <Input
                  placeholder="例如：PEPXiaoXue3_1"
                  value={form.bookId}
                  onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>标签（逗号分隔）</FieldLabel>
                <Input
                  placeholder="例如：小学, 英语, PEP"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                取消
              </DialogClose>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  placeholder="搜索单词书名称或 bookId..."
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
                <TableHead className="w-[50px]">封面</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>单词数量</TableHead>
                <TableHead>bookId</TableHead>
                <TableHead>标签</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredBooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchQuery ? "没有找到匹配的单词书" : "暂无单词书，点击「新建单词书」开始创建"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <CoverImage url={book.coverUrl} title={book.title} />
                    </TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.wordCount} 词</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{book.bookId}</code>
                    </TableCell>
                    <TableCell>
                      <TagList tags={book.tags} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(book)}>
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(book.id, book.title)}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}