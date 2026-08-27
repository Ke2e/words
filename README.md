# words

<br />

## 应用形式

- 后台管理系统
- h5 应用
- 多端应用开发

<br />

## 亮点

- 数据清洗
  - 在 github 上找到了一个 高 star 数的单词资料库，接下来要进行数据清洗（数据的选择、格式化、审核）
  - 数据库 supabase 云端 psql 数据库
    - 关系型数据库
    - 支持向量数据库
    - 云端 BASS 数据库
      - Backend as a service
- ORM （Object-Relational Mapping，对象关系映射）
  - 不用写 SQL ，不用做数据库的底层处理
  - 使用 ORM 后，开发者通常不需要手写大量 SQL，而是可以通过操作对象来完成数据库操作：
    ```Python
    user = User(name="张三", age=18)
    db.save(user)
    ```
    ORM 会自动生成类似的 SQL：
    ```SQL
    INSERT INTO users (name, age) VALUES ('张三', 18);
    ```
  - todo.save() 保存之后 就能直接将对应的对象数据存储到数据库中
  - 对象和数据库一行记录 对应起来

## 后台管理系统

### 单词书管理

维护单词书，包括单词书的创建、删除、更新、查询等操作。（定制化需求）

单词书的管理交给小编（员工）使用，此时需要权限分割

### 管理员管理

- 注册超级管理员，一个人
  - 可以添加普通管理员
- / -> 注册超级管理员页面 -> 登录
- / -> 登录页
  - -> 单词书管理页面

## shadcn/ui UI 组件库

- 80% 前端组件业务趋同，不用重复造轮子，可以选用第三方组件库也就是shadcn/ui组件库
- element-ui / ANTD Design
- shadcn 定制性很好，内部直接使用 tailwindcss 
  - 语义化很好，对 ai 很友好
  - 按需加载
- 组件都在 /components/ui 目录下

<br />

## supabase

- BASS 数据库云服务
- 性能、安全、可扩展性、部署成本几乎为0
- psql 支持 embedding（向量嵌入）+关系型数据库
  - !ecut7paper2025

<br />

## Conventional Commits（约定式提交）规范，也是目前最主流的 Git 提交信息风格。

- &#x20;feat 新增功能
- &#x20;fix 修复 bug
- &#x20;docs 文档变更
- &#x20;refactor 代码重构
- &#x20;style 样式变更
- &#x20;test 测试变更
- &#x20;chore 构建工具变更

使用 coding agent 内置的 git 进行 add 到暂存区或者 push 到远端

<br />

## ORM （Object-Relational Mapping，对象关系映射）

- 数据库 supabase 已云端创建
  - .env DATABASE\_URL 
  - next.js 面向对象编程  高级语言
    - 一个表（user table）就是一个类（user class），其中是通过 drizzle orm 映射
    - User user.save() -> sql insert into 
    - ORM 将实际的代码运行翻译成对应的 sql 语句并直接执行
  - 让 drizzle 接手数据库 .env
    - 不需要手动建表，直接建立 schema ，orm 会直接映射成对应的 数据表
    - migrate 数据表迁移，orm 会将 schema 迁移到数据库并创建对应的数据库表

## Drizzle

- 是一种 ORM 工具，有一系列的包和命令
  - db 目录中
    - index.ts 数据库配置链接，并返回 db 数据库操作句柄
    - schema.ts 对象定义数据库表结构
  - 配套了一系列脚本
    - db:generate 生成数据库迁移文件
      - 数据库加表，改字段，添加索引等等
      - 执行之后，会多一个 schema 文件
    - db:migrate 数据库迁移，将 schema 迁移到数据库并创建对应的数据库表
    - db:push 数据库推送，将数据库迁移文件 迁移到数据库
    - db:reset 数据库重置，将数据库重置为初始状态
    - db:studio 数据库管理工具，用于管理数据库表和数据

<br />

## words 表

- github 下载 zip -> json 文件（178kb）
  - 需要创建一个 words 表
  - 如何导入这个数据？ json -> sql/csv 直接导入数据库
  - 让 ai 将 #json 转成 csv 格式
    - 但是 数据量很大，...178kb token 
  - 让 ai 写一段格式转换脚本（1k token），然后我本地运行就能完成数据的处理了

## 数据清洗

- 常见的后端功能
  - /scripts/ 后端脚本目录下
    - 解决一些问题 
      - 爬虫
      - 数据格式转换 等
        - 能够直接交给 ai 来做，但是由于 token 开销大，还有就是上下文窗口占用大
        - 直接让 ai 生成 script 脚本，本地运行
        - ai 的自动化工作（审查、测试等），制作脚本工作
- 数据库表 RLS
  - 行安全 words 公共表没必要开启
  - 每个用户的背单词的进度就需要开启
- prompt 执行上下文的考虑
  - 给 prompt 提供充足的上下文
    - 数据表、技术架构等，可以放入 Agents.md 文件，每次调用会话都会查看这个文件，这就是项目的全局上下文
  - prompt 会带有一些隐藏的上下文开销，你引用的文件首先是上下文，还有就是他可能会去调查与之相关的其他消息来进行一些补充
    - 此时将一些信息直接给到 AI ，它可能就没有必要去直接读文件，也就不会加深上下文负担，例如告诉它 文件的生成格式

## 让 AI 了解 supabase 上有 books 表

- 本地根据 supabase 上的格式，创建对应的 schema
- 完成后台图书业务与显示工作

## cascade 级联删除

- 在外键声明的后面加上
  - on delete cascade

## Prompt 颗粒度

- 上下文一定要准确且清晰
- 规则或规范，表单字段，业务场景，功能描述需要详细表达，不要让 LLM 去猜
- LLM 擅长的，例如生成代码，让它直接去跑

