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

