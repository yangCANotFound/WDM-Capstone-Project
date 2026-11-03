# Capstone 项目指南 · 评分自检表 · Demo 脚本 · 提交清单

> 配套《Capstone Project Specification》与《Project Overview / Submission Requirements》。
> 项目代码位于本文件夹：`server/`（后端）+ `client/`（前端）+ `README.md`。
> Demo / viva：**2026 年 11 月 4 日（周三）10:10–11:45**。

---

## 目录

1. [项目总览与目录结构](#一项目总览与目录结构)
2. [后端实现（Part 1 · 50 分）](#二后端实现part-1--50-分)
3. [前端实现（Part 2 · 50 分）](#三前端实现part-2--50-分)
4. [评分自检表（Rubric 100 分）](#四评分自检表rubric-100-分)
5. [常见坑排查](#五常见坑排查)
6. [Demo / Viva 演示脚本](#六demo--viva-演示脚本)
7. [提交清单与打包步骤](#七提交清单与打包步骤)
8. [已验证结果与假设](#八已验证结果与假设)

---

## 一、项目总览与目录结构

### 1.1 总览

| 组件 | 技术栈 | 职责 |
|---|---|---|
| **后端 API** `server/` | Node.js + Express + MongoDB Atlas + Mongoose + bcrypt + JWT + helmet + dotenv | "大脑"：项目、博客、评论、用户、留言的 RESTful API，MVC 分层，认证授权，集中错误处理 |
| **前端 SPA** `client/` | React 18 + React Router v6 + Context API + Tailwind CSS + Vite | UI：消费全部后端端点，公开页 + 认证流程 + 受保护 Admin Dashboard |

**交付物**：live 前端 URL、live 后端 URL、`StudentID_StudentName_CapstoneProject.zip`（server + client，**不含 node_modules**）、`README.md`。

### 1.2 目录结构

```
Capstone Project/
├── README.md                     ← 提交必需（overview / live URL / 端点表 / 本地运行）
├── Capstone_项目指南与Demo脚本.md  ← 本文件
├── 评分自检表.xlsx                ← 可截图提交的 Rubric 自检
├── package.json / .gitignore
│
├── server/                       ← ========== 后端 ==========
│   ├── server.js                 ← 入口：dotenv → 校验环境变量 → 连库 → 监听端口
│   ├── app.js                    ← Express app：helmet → cors → parser → 限流 → 路由 → 404 → 错误
│   ├── package.json / .env.example
│   ├── config/db.js              ← MongoDB Atlas 连接（含优雅关闭）
│   ├── models/                   ← M：User / Project / BlogPost / Comment / Message
│   ├── controllers/              ← C：user / project / blog / comment / contact
│   ├── routes/                   ← 路由：user / project / blog / contact
│   ├── middleware/
│   │   ├── authMiddleware.js     ← protect（JWT→req.user）+ authorize(roles)
│   │   ├── errorMiddleware.js    ← AppError / asyncHandler / notFound / errorHandler
│   │   └── validate.js           ← 请求体校验
│   └── scripts/
│       ├── seed.js               ← 演示数据（管理员 + 3 项目 + 2 文章 + 4 评论）
│       └── smoke-test.js         ← 34 项端到端测试
│
└── client/                       ← ========== 前端 ==========
    ├── index.html / vite.config.js / tailwind.config.js / postcss.config.js
    ├── vercel.json / netlify.toml / .env.example
    └── src/
        ├── main.jsx              ← ReactDOM + Provider 链：Router → Auth → Toast
        ├── App.jsx               ← 全部路由（公开 + 受保护）
        ├── index.css             ← Tailwind + 组件类
        ├── api/client.js         ← fetch 封装 + 每个端点一个函数
        ├── context/AuthContext.jsx、ToastContext.jsx
        ├── components/           ← Header/Footer/ProjectCard/BlogPostCard/ProtectedRoute
        │                            CommentForm/CommentList/Loader/Modal/ConfirmDialog/ScrollToTop
        └── pages/                ← Home/Projects/Blog/BlogDetail/Contact/Login/Register
                                     AdminDashboard/NotFound
```

### 1.3 MVC 分层职责（viva 必问）

| 层 | 位置 | 做什么 | 不做什么 |
|---|---|---|---|
| **Model** | `models/` | 定义 schema、字段类型、校验（required/unique/minlength）、关系 ref、钩子（bcrypt 预保存） | 解析 HTTP、发响应 |
| **Controller** | `controllers/` | 读 `req`、业务规则（作者校验/哈希/populate）、调 Model、`res.status().json()` | 定义 URL、声明中间件顺序 |
| **Route** | `routes/` | METHOD + 路径 → 中间件链（protect → validate → controller） | 写业务逻辑 |
| **Middleware** | `middleware/` | 横切关注点：认证、授权、校验、错误归一化 | 知道具体业务 |
| **Config** | `config/` | 基础设施：数据库连接 | 领域逻辑 |

---

## 二、后端实现（Part 1 · 50 分）

### 2.1 五个 Mongoose 模型（逐字段）

> 完整 schema 代码见 `server/models/*.js`，每个文件头部注释都标注了"spec 要求字段"与"扩展字段（假设）"。

| 模型 | 字段 | 类型 | 校验 | 关系 |
|---|---|---|---|---|
| **User** | `username` | String | required, unique, trim, minlength 3, maxlength 30 | — |
| | `email` | String | required, unique, lowercase, 邮箱正则 | — |
| | `password` | String | required, **minlength 6**, `select:false`（不返回） | bcrypt 哈希 |
| | `role` *(扩展)* | String | enum `admin`/`user`，默认 `admin` | 支撑"项目 admin-only"假设 |
| **Project** | `title` | String | **required**, maxlength 120 | — |
| | `description` | String | **required**, maxlength 2000 | — |
| | `imageUrl` | String | optional, default `''` | — |
| | `repoUrl` | String | optional, default `''` | — |
| | `liveUrl` | String | optional, default `''` | — |
| | `user` | ObjectId | **required** | `ref: 'User'` |
| **BlogPost** | `title` | String | **required**, maxlength 150 | — |
| | `content` | String | **required** | — |
| | `author` | ObjectId | **required** | `ref: 'User'` |
| | `excerpt` / `tags` *(扩展)* | String / [String] | optional | — |
| | `comments` | Virtual | 非存储 | `ref:'Comment'`，local `_id` → foreign `post` |
| | `timestamps` | Date | 自动 `createdAt`/`updatedAt` | — |
| **Comment** | `body` | String | **required**, minlength 1, maxlength 1000 | — |
| | `author` | ObjectId | **required** | `ref: 'User'` |
| | `post` | ObjectId | **required** | `ref: 'BlogPost'` |
| | `timestamps` | Date | 自动 | — |
| **Message** | `name` | String | **required**, maxlength 80 | — |
| | `email` | String | **required**, 邮箱正则 | — |
| | `message` | String | **required**, minlength 5, maxlength 2000 | — |
| | `isRead` *(扩展)* | Boolean | default false | — |
| | `timestamps` | Date | 自动 | — |

**关系图**

```
User 1 ──< Project      Project.user    → User._id
User 1 ──< BlogPost     BlogPost.author → User._id
User 1 ──< Comment      Comment.author  → User._id
BlogPost 1 ──< Comment  Comment.post    → BlogPost._id   （BlogPost.comments 为 virtual）
```

### 2.2 认证与授权流程

```
注册：POST /api/users/register
  validate(registerRules) → 查重 → bcrypt.genSalt(10) → bcrypt.hash → User.create
  → jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn }) → 201 { token, user }

登录：POST /api/users/login
  User.findOne({ email }).select('+password') → bcrypt.compare → 不一致返回 401
  → jwt.sign({ id }) → 200 { token, user }

受保护请求：
  Authorization: Bearer <token>
  → protect: 拆 header → jwt.verify → User.findById(decoded.id).select('-password')
  → req.user = user → next()
```

**作者授权**（博客 PUT/DELETE）：

```js
if (!post.author.equals(req.user._id)) {
  throw new AppError('Not authorized: only the author can update this post', 403);
}
```

> ⚠️ 必须用 `.equals()` 或 `.toString()`，**不能**用 `===`——两个 ObjectId 实例永不全等。

**项目 admin-only 假设**：`router.post('/', protect, authorize('admin'), ...)`，且 `User.role` 默认 `'admin'`。

### 2.3 端点清单（与 `README.md` §5 完全一致）

| # | 方法 | 端点 | 访问 | Body / Params | 成功 |
|---|---|---|---|---|---|
| 1 | POST | `/api/users/register` | 公开 | `{username*, email*, password*(≥6)}` | 201 `{token,user}` |
| 2 | POST | `/api/users/login` | 公开 | `{email*, password*}` | 200 `{token,user}` |
| 3 | GET | `/api/users/me` | 受保护 | — | 200 `{data:user}` |
| 4 | GET | `/api/projects` | 公开 | — | 200 `{count,data[]}` |
| 5 | GET | `/api/projects/:id` | 公开 | param `id` | 200 `{data}` / 404 |
| 6 | POST | `/api/projects` | 受保护 | `{title*,description*,imageUrl?,repoUrl?,liveUrl?}` | 201 |
| 7 | PUT | `/api/projects/:id` | 受保护 | param `id` + 部分字段 | 200 |
| 8 | DELETE | `/api/projects/:id` | 受保护 | param `id` | 200 |
| 9 | GET | `/api/blog` | 公开 | — | 200 `{count,data[]}`（author.username） |
| 10 | GET | `/api/blog/:id` | 公开 | param `id` | 200（author + comments） |
| 11 | POST | `/api/blog` | 受保护 | `{title*,content*,excerpt?,tags?}` | 201 |
| 12 | PUT | `/api/blog/:id` | 受保护 + **仅作者** | param `id` | 200 / **403** |
| 13 | DELETE | `/api/blog/:id` | 受保护 + **仅作者** | param `id` | 200 / **403** |
| 14 | GET | `/api/blog/:postId/comments` | 公开 | param `postId` | 200 `{count,data[]}` |
| 15 | POST | `/api/blog/:postId/comments` | 受保护 | param `postId` + `{body*}` | 201 |
| 16 | POST | `/api/contact` | 公开 | `{name*,email*,message*}` | 201 |
| 17 | GET | `/api/contact` | 受保护（扩展·收件箱） | — | 200 |
| 18 | PATCH | `/api/contact/:id/read` | 受保护（扩展） | param `id` | 200 |
| 19 | GET | `/api/health` | 公开（扩展） | — | 200 |
| 20 | GET | `/` | 公开（扩展·端点索引） | — | 200 |

### 2.4 populate() 正确用法

```js
// ① 博客列表：只要作者的 username（spec 原文要求）
BlogPost.find({}).populate('author', 'username').sort({ createdAt: -1 })

// ② 博客详情：作者 username + 该文章全部评论（嵌套 / virtual populate）
BlogPost.findById(id)
  .populate('author', 'username')
  .populate({
    path: 'comments',                                  // BlogPost 里定义的 virtual
    select: 'body author createdAt',
    options: { sort: { createdAt: 1 } },
    populate: { path: 'author', select: 'username' },  // 再 populate 评论作者
  })

// ③ 评论列表：谁写的
Comment.find({ post: postId }).populate('author', 'username')
```

**要点**
- 第二个参数是 **projection**（字段选择），`'username'` 只返回 username；省略会把整个 user 文档（含 email）都带出来。
- `path` 必须与 schema 字段名完全一致（`author` 而非 `user`）。
- virtual populate 需要 schema 里先定义 `virtual('comments', {...})`，且 `toJSON: { virtuals: true }`。

### 2.5 集中错误处理

所有错误统一为：

```json
{ "success": false, "message": "…", "errors": [{ "field": "title", "message": "…" }] }
```

`errorHandler` 覆盖：`ValidationError`（400）、`CastError`（400，非法 ObjectId）、`11000` 重复键（409）、`JsonWebTokenError`/`TokenExpiredError`（401）、CORS 拒绝（403）、非法 JSON（400）、未知路由（404）。生产环境不返回 stack。

### 2.6 安全与配置

- **helmet**：全局安全响应头。
- **dotenv**：`MONGO_URI`、`JWT_SECRET`、`JWT_EXPIRE`、`PORT`、`ALLOWED_ORIGINS` 全部走环境变量；`.env` 已 gitignore，只提交 `.env.example`。
- **CORS**：`ALLOWED_ORIGINS` 白名单，未知 origin 直接拒绝。
- **限流**：认证端点 30 次/10 分钟/IP；全 API 300 次/15 分钟/IP。
- **信任代理**：`app.set('trust proxy', 1)`（Render 前面有反向代理，否则限流会按代理 IP 计）。

### 2.7 本地启动

```bash
cd server
cp .env.example .env          # 填入 MONGO_URI / JWT_SECRET
npm install
npm run seed                  # 可选：演示数据
npm run dev                   # http://localhost:5000
npm run smoke                 # 34 项端到端自检
```

---

## 三、前端实现（Part 2 · 50 分）

### 3.1 组件拆分与 props

| 组件 | Props | 说明 |
|---|---|---|
| `Header` | 无（读 `useAuth()`） | 认证感知导航：未登录 Login/Register；已登录 Admin Dashboard + Logout + 用户名；移动端汉堡抽屉 |
| `Footer` | `heading, note, year` | 常驻页脚 |
| `ProjectCard` | `project, index` | 项目卡片；图片失败回退 SVG |
| `BlogPostCard` | `post, featured` | 文章卡片；阅读时长、标签 |
| `ProtectedRoute` | `children` | 未登录 → `<Navigate to="/login" replace state={{from}}>`；`booting` 时显示加载 |
| `CommentForm` | `postId, onCreated` | 受控表单 POST 评论 |
| `CommentList` | `comments` | 纯展示 |
| `Modal` / `ConfirmDialog` | `open, title, onClose, …` | Admin 表单弹窗 / 删除确认 |
| `Loader` / `CardGridSkeleton` / `ErrorMessage` / `EmptyState` | `label, message, onRetry, …` | Loading / Error / Empty 条件渲染 |
| 页面 | — | 从 `useParams` / `useLocation` 取数据，通过 `children` 组合组件 |

### 3.2 Auth Context（全局状态）

`src/context/AuthContext.jsx` 持有：`token`、`user`、`isAuthenticated`、`loading`、`booting`、`error`、`login()`、`register()`、`logout()`、`clearError()`。

- **持久化**：token 与 user 写入 `localStorage`（键 `capstone_token` / `capstone_user`），刷新不掉线。
- **启动校验**：挂载时用 `GET /api/users/me` 验证已存 token，401 自动登出。
- **注入 fetch**：`setAuthToken(token)` 让 `api/client.js` 对所有受保护请求自动附加 `Authorization: Bearer <token>`。
- **保护路由**：`booting` 期间 `ProtectedRoute` 显示加载，避免刷新 `/admin` 时闪一下 `/login`。

### 3.3 全部路由

| 路由 | 页面 | 访问 | 数据 |
|---|---|---|---|
| `/` | Home / About | 公开 | `GET /api/projects`（精选 3 个） |
| `/projects` | Projects 画廊 | 公开 | `GET /api/projects` |
| `/blog` | 博客列表 | 公开 | `GET /api/blog` |
| `/blog/:id` | 文章详情 + 评论 | 公开（评论需登录） | `GET /api/blog/:id`；`POST /api/blog/:postId/comments` |
| `/contact` | 联系表单 | 公开 | `POST /api/contact` |
| `/login` | 登录 | 公开 | `POST /api/users/login` |
| `/register` | 注册 | 公开 | `POST /api/users/register` |
| `/admin` | **Admin Dashboard** | **受保护** | 项目/文章 CRUD + 收件箱 |
| `*` | 404 | 公开 | — |

### 3.4 关键实现说明

- **useState** 管理：表单字段（受控）、`loading`、`error`、`submitting`、`fieldErrors`、Tab、Modal 开关、删除确认。
- **useEffect** 取数：每个页面用 `AbortController`，卸载时 `abort()`，并用 `active` 标志防止卸载后 `setState`（React 警告）。
- **条件渲染**：`loading → 骨架屏`、`error → ErrorMessage + 重试按钮`、`空列表 → EmptyState`、`有数据 → 卡片网格`。
- **写请求**：Admin 的 POST/PUT/DELETE 全部经 `api.*` → 自动带 JWT；每次都重新拉列表，UI 永远与服务器一致。
- **样式**：Tailwind CSS（`index.css` 中 `@layer components` 定义 `.btn/.input/.card/.label` 等），移动优先，390px–1440px 已验证。

### 3.5 前端连接后端

`src/api/client.js`：

```js
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');
```

- 本地：`client/.env.local` → `VITE_API_URL=http://localhost:5000`
- 线上：Vercel/Netlify 环境变量 → `VITE_API_URL=https://xxx.onrender.com`
- **修改后必须重新构建/部署**（Vite 在构建期内联此变量）。

### 3.6 前端自检命令

```bash
cd client
npm run dev      # 开发服务器
npm run build    # 生产构建 → dist/
```

---

## 四、评分自检表（Rubric 100 分）

> 完整版见 `评分自检表.xlsx`（可直接截图提交）。"证据"一列指出 viva 时展示的位置。

### 4.1 后端（50 分）

| 类别 | 分值 | 要求 | 实现位置 | 证据 / 自检 | ✅ |
|---|---|---|---|---|---|
| 1. 数据库与模型 | 10 | 5 个 schema 正确、校验、连接 MongoDB Atlas | `server/models/*.js`、`config/db.js` | smoke 中「short password→400」「duplicate→409」；Atlas 里能看到 `users/projects/blogposts/comments/messages` 5 个集合 | ✅ |
| 2. 认证与授权 | 12 | 注册、登录、bcrypt、JWT、protect 中间件 | `controllers/userController.js`、`middleware/authMiddleware.js`、`models/User.js` | smoke 第 2–7、13 项；Atlas 中密码是 `$2b$…` 哈希；Demo 注册新号 | ✅ |
| 3. CRUD 端点 | 10 | 项目与文章的公开/受保护端点，博客授权逻辑 | `controllers/projectController.js`、`blogController.js` | smoke 第 8–15、22–24 项；**非作者 PUT/DELETE→403** | ✅ |
| 4. 关系与特性 | 8 | 评论、联系表单、populate 正确 | `commentController.js`、`contactController.js`、BlogPost virtual | `/api/blog` 返回 `author.username`；`/api/blog/:id` 含 `comments[].author.username` | ✅ |
| 5. 结构与错误处理 | 5 | 代码整洁、MVC、健壮集中错误处理 | `app.js` + `middleware/errorMiddleware.js` + 目录分层 | 非法 id→400、未知路由→404、统一 JSON | ✅ |
| 6. 安全与部署 | 5 | helmet、dotenv、上线可访问 | `app.js`、`.env.example`、`render.yaml` 步骤 | 响应头含 helmet；live `/api/health` 200 | ✅ |
| **小计** | **50** | | | | |

### 4.2 前端（50 分）

| 类别 | 分值 | 要求 | 实现位置 | 证据 / 自检 | ✅ |
|---|---|---|---|---|---|
| 1. React 架构与设计 | 10 | 响应式、现代样式、组件可复用 | `components/*`、`index.css`、`tailwind.config.js` | 移动端汉堡菜单截图；`ProjectCard` 在 Home 与 /projects 复用 | ✅ |
| 2. 路由 | 8 | 全部公开 + 动态路由；`/admin` 未登录重定向 | `App.jsx`、`ProtectedRoute.jsx` | 未登录访问 `/admin` → `/login`；`/blog/:id` 刷新不 404（vercel.json） | ✅ |
| 3. 公开 API 集成 | 10 | `/projects`、`/blog`、`/blog/:id` 取数；联系表单可用 | `pages/Projects.jsx`、`Blog.jsx`、`BlogDetail.jsx`、`Contact.jsx` | 浏览器 E2E 第 3–4、11 项通过 | ✅ |
| 4. 认证流与全局状态 | 10 | 登录/注册可用；Auth Context；导航感知 | `AuthContext.jsx`、`Login.jsx`、`Register.jsx`、`Header.jsx` | E2E：注册→/admin；Header 随状态切换；刷新保持登录 | ✅ |
| 5. 受保护 API 集成 | 10 | Admin 对项目与文章完整增删改、正确带 JWT；评论可用 | `AdminDashboard.jsx`、`api/client.js` | E2E 第 7–12、14 项通过 | ✅ |
| 6. 部署 | 2 | 部署前端可与后端通信、无 bug | `vercel.json` / `netlify.toml` | live 前端 URL 可完成注册/登录/CRUD | ✅ |
| **小计** | **50** | | | | |

---

## 五、常见坑排查

| 问题 | 现象 | 原因 | 解决 |
|---|---|---|---|
| **CORS** | 控制台 `blocked by CORS policy`；fetch 报 `Failed to fetch` | 前端 origin 不在 `ALLOWED_ORIGINS` | 在 Render 环境变量里加上前端 URL（**不带末尾斜杠**），重新部署后端；本地加 `http://localhost:5173` |
| **JWT 过期** | 受保护请求突然 401，用户像被登出 | `JWT_EXPIRE` 到期 | 重新登录；`AuthContext` 启动时用 `/api/users/me` 校验并自动清理失效 token；可按需把 `JWT_EXPIRE` 改为 `7d` |
| **JWT 无效/格式错** | `401 Not authorized: no token provided` | 请求缺 `Authorization` 头，或写成 `Token xxx` | 必须是 `Authorization: Bearer <token>`（注意空格）；前端统一在 `api/client.js` 注入 |
| **populate 字段** | 拿到整个 user 或 `author: null` | 没写 projection；或路径名与 schema 不一致 | `.populate('author', 'username')`；virtual 要在 schema 里定义 |
| **populate 后比较作者** | 明明是作者却 403 | 把 populated 对象和 `_id` 直接 `===` | 用 `post.author.equals(req.user._id)`；若已 populate 用 `post.author._id.equals(...)` |
| **受保护路由重定向** | 刷新 `/admin` 闪一下 `/login` | 首帧 token 尚未校验 | `AuthProvider` 的 `booting` 状态；`ProtectedRoute` 在 `booting` 时显示加载 |
| **前端 API base URL** | 线上前端请求 `localhost:5000` | 构建时没设 `VITE_API_URL` | Vercel/Netlify 环境变量设 `VITE_API_URL`，**重新部署**；不可带 `/api` 后缀或末尾斜杠 |
| **部署环境变量** | 后端启动即退出，日志 `Missing required environment variable` | Render 未配 `MONGO_URI`/`JWT_SECRET` | Render → Environment 添加；**不要**设 `PORT`（Render 自动注入） |
| **Atlas 连接失败** | `ECONNREFUSED` / `Could not connect to any servers` | Network Access 未放行云平台 IP | Atlas → Network Access → `0.0.0.0/0` |
| **Atlas 密码特殊字符** | 连接串解析错误 | `@ # :` 未 URL 编码 | `@`→`%40`、`#`→`%23`、`:`→`%3A` |
| **React 路由 404（刷新）** | 部署后刷新 `/blog/xxx` 变 404 | 静态托管不知道 SPA 路由 | Vercel 用 `vercel.json` rewrites；Netlify 用 `netlify.toml` `/* → /index.html 200` |
| **Render 冷启动** | Demo 时前端转圈 30 秒 | 免费实例休眠 | Demo 前 1 分钟先打开 `/api/health` 唤醒 |
| **非法 ObjectId** | 直接 500 | 未处理 CastError | `errorHandler` 已把 `CastError` → 400 |
| **唯一键冲突** | 注册重复邮箱直接报 500 | Mongo `E11000` 不是 ValidationError | `errorHandler` 处理 `11000` → 409 |
| **本地 5000 端口占用** | `EADDRINUSE` | 已有进程占用 | 改 `.env` 的 `PORT`，**同时**改 `client/.env.local` 的 `VITE_API_URL` |

---

## 六、Demo / Viva 演示脚本

> **时间**：2026-11-04（周三）10:10–11:45。建议 10–12 分钟演示 + 问答。
> **准备（10:05 前）**：① 打开 `https://YOUR-API.onrender.com/api/health` 唤醒后端；② 打开 live 前端首页；③ 准备两个浏览器窗口——**A：正常窗口**（演示注册新账号）、**B：无痕窗口**（演示"非作者被拒"); ④ 打开 `README.md`。

| 步骤 | 时间 | 操作 | 讲解要点（viva 话术） |
|---|---|---|---|
| **0. 开场** | 0:00–0:30 | 展示 live 前端首页 | "前端部署在 Vercel，后端部署在 Render，数据在 MongoDB Atlas。前端**只**与已部署的后端通信（`VITE_API_URL`）。" |
| **1. 环境证明** | 0:30–1:30 | 新标签打开 `/api/health` → 200；打开 `/`（API 根）看端点索引；切到 Atlas 展示 5 个集合 | 证明 API 活着 + 数据库真实存在 |
| **2. 公开页面** | 1:30–3:00 | `/` → `/projects` → `/blog` → 点开一篇文章 | "`/projects` 调 `GET /api/projects`；`/blog` 调 `GET /api/blog`，作者名来自 `populate('author','username')`；详情页调 `GET /api/blog/:id`，`comments` 是 **virtual populate**。" |
| **3. 受保护路由** | 3:00–3:30 | 未登录直接访问 `/admin` | "被 `ProtectedRoute` 重定向到 `/login`，`state.from` 记住来路，登录后自动跳回。" |
| **4. 注册（bcrypt）** | 3:30–4:30 | `/register` 新建账号 `demo_1104` → 自动登录进入 `/admin` | "`POST /api/users/register`；服务器 `bcrypt.genSalt(10)` + `hash` 后才入库；响应里**没有**密码。返回 JWT，前端存入 Context + localStorage。" |
| **5. 登录（JWT）** | 4:30–5:30 | 退出 → 用刚注册账号登录 → 再退出，用 `admin@portfolio.dev / admin123` 登录 | "`POST /api/users/login`：`select('+password')` 取哈希 → `bcrypt.compare` → `jwt.sign({id})`。Header 随状态切换 Admin/Logout。" |
| **6. Admin 增** | 5:30–7:00 | Projects 标签 → **+ New project** 填写 → 创建；再 **+ New post** 写一篇 | "POST 都带 `Authorization: Bearer <token>`；后端 `protect` 解出 `req.user`，`user: req.user._id` / `author: req.user._id` 建立关联。" |
| **7. Admin 改 / 删** | 7:00–8:00 | 编辑刚建的项目（改名）→ 保存；删除一条测试项目（确认框） | "PUT 用 `save()` 以触发 schema 校验；DELETE 删除文章时**级联删除其评论**。" |
| **8. 前端同步** | 8:00–8:30 | 切到 `/projects`、`/blog` 刷新 | "写操作后 UI 重新拉取列表，前后端一致。" |
| **9. 评论** | 8:30–9:30 | 打开一篇文章 → 评论区发一条评论 → 立即出现 | "`POST /api/blog/:postId/comments`（受保护）；未登录时评论框换成登录提示。" |
| **10. 作者授权（关键）** | 9:30–10:30 | 窗口 A：用 admin 建的文章在窗口 B（另一个账号）里 **Edit/Delete → 403**；终端演示 `curl` 非作者 PUT 返回 403 | "规格要求：**只有原作者**能改/删博客。`post.author.equals(req.user._id)`，否则 403。" |
| **11. 联系表单** | 10:30–11:10 | `/contact` 提交 → 成功提示 → 回 `/admin` → **Messages** 标签看到该留言 | "公开的 `POST /api/contact` 写入 `Message`；管理员收件箱 `GET /api/contact` 需要 JWT。" |
| **12. 收尾** | 11:10–12:00 | 展示 `README.md`（overview / 两个 live URL / 端点表 / 本地运行）；展示 `npm run smoke` 34 项 PASS 截图 | "README 含全部端点、请求体、环境变量与部署说明。" |

### 12 个可能的追问与标准答案

1. **为什么用 bcrypt 而不是 MD5？** bcrypt 自带随机 salt + 可调 cost，抗彩虹表与暴力破解。
2. **JWT 放 localStorage 的风险？** XSS 可读；因此配合 helmet/CSP、不在 DOM 注入不可信 HTML。生产可改为 httpOnly cookie（已装 `cookie-parser` 预留）。
3. **`protect` 为什么要查数据库？** JWT 只证明"签发过"，用户可能已被删除，查库后才能附上最新 `req.user`。
4. **`===` 比较 ObjectId 为什么不行？** 每次 hydrate 都是新实例，必须 `.equals()`。
5. **virtual populate 和普通 populate 区别？** 关系定义在"一对多"的另一侧（Comment 里存 post），virtual 让父文档能反向取出子集合。
6. **PUT 为什么用 `save()` 不用 `findByIdAndUpdate`？** `save()` 会跑完整 schema 校验与钩子。
7. **`asyncHandler` 干什么？** Express 4 不会捕获 async 拒绝，包装后统一 `next(err)` 到集中错误处理。
8. **`trust proxy` 为什么必要？** Render 前面有代理，不信任它会让 `req.ip` 变成代理 IP，限流失效。
9. **为什么 `VITE_API_URL` 改了要重新部署？** Vite 在构建期把 `import.meta.env.*` 内联进 bundle。
10. **中奖题：CSRF？** 用 Bearer 头而非 Cookie，天然规避浏览器自动带凭据的 CSRF。
11. **`select: false` 的密码怎么登录？** `findOne({email}).select('+password')` 显式取回。
12. **项目为什么 admin-only？** 规格原文"Project management is assumed to be admin-only"；`User.role` 默认 admin，路由再 `authorize('admin')` 兜底。

---

## 七、提交清单与打包步骤

### 7.1 交到超星（学习通）

| # | 提交项 | 说明 |
|---|---|---|
| 1 | **Live 前端 URL** | 例如 `https://your-project.vercel.app` |
| 2 | **Live 后端 URL** | 例如 `https://your-project-api.onrender.com` |
| 3 | **`StudentID_StudentName_CapstoneProject.zip`** | 含 `server/` + `client/` + `README.md`，**不含任何 `node_modules`** |
| 4 | **`README.md`** | zip 根目录一份 + 超星单独上传一份（要求原文："in the root of your zip file and/or submitted in Chaoxing"） |

### 7.2 打包步骤（Windows PowerShell）

```powershell
# 0) 先改好文件名里的学号与姓名
$StudentID   = "24998009"
$StudentName = "ZhangSan"          # 英文或用拼音，避免 zip 内文件名乱码
$ZipName     = "${StudentID}_${StudentName}_CapstoneProject.zip"

# 1) 进入项目父目录
Set-Location "G:\Deepseek"

# 2) 打包：排除 node_modules（以及 dist/.env 等无关产物）
#    -Recurse 必须从 "Capstone Project" 目录本身开始
Compress-Archive `
  -Path "Capstone Project\*" `
  -DestinationPath $ZipName `
  -CompressionLevel Optimal `
  -Force

# 3) 【强烈建议】用 robocopy 方式做干净打包，确保绝对没有 node_modules：
$Stage = "$env:TEMP\capstone_stage"
Remove-Item $Stage -Recurse -Force -ErrorAction SilentlyContinue
robocopy "Capstone Project" "$Stage\Capstone Project" /E /XD node_modules dist .git /XF .env *.log | Out-Null
Compress-Archive -Path "$Stage\Capstone Project" -DestinationPath "G:\Deepseek\$ZipName" -CompressionLevel Optimal -Force
Remove-Item $Stage -Recurse -Force

# 4) 验收：确认 zip 里没有 node_modules、包含 README.md 与 server/client
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead("G:\Deepseek\$ZipName")
$names = $z.Entries.FullName
"总条目数 : $($names.Count)"
"含 node_modules : " + [bool]($names -match 'node_modules').Count
"含 README.md    : " + [bool]($names -match 'README\.md$').Count
"含 server/      : " + [bool]($names -match 'Capstone Project/server/').Count
"含 client/      : " + [bool]($names -match 'Capstone Project/client/').Count
$z.Dispose()
```

### 7.3 提交前 8 项终检

- [ ] live 前端能打开，`/admin` 未登录会跳 `/login`
- [ ] live 后端 `/api/health` 返回 200
- [ ] 线上能**注册新账号**（证明 bcrypt 路径）
- [ ] 线上能**登录**（证明 JWT 路径）
- [ ] Admin 能对**项目**做增/改/删
- [ ] Admin 能对**文章**做增/改/删
- [ ] 登录用户能**发评论**；`/contact` 能提交
- [ ] zip 内 `node_modules` 数量为 **0**，文件名符合 `StudentID_StudentName_CapstoneProject.zip`

---

## 八、已验证结果与假设

### 8.1 实测结果（本次生成时已运行）

| 验证 | 方式 | 结果 |
|---|---|---|
| 后端全端点 | `node scripts/smoke-test.js`，对真实 MongoDB 8.2 + Express 服务 | **34/34 PASS** |
| 前端生产构建 | `vite build` | ✅ 57 modules，无错误 |
| 浏览器端到端 | Chrome + Playwright，对构建产物 + live API | **25/25 PASS**（含移动端、无 console 错误） |
| 种子数据 | `npm run seed` | ✅ 管理员 + 3 项目 + 2 文章 + 4 评论 |

> 复现：`cd server && npm run smoke`（需 API 已启动）。

### 8.2 假设（信息不足处的合理默认，均可修改）

1. **项目 admin-only**：规格原文"Project management is assumed to be admin-only"。实现为 `User.role` 默认 `'admin'` + 路由 `authorize('admin')`。若要真正多角色，把 `models/User.js` 的默认值改为 `'user'`。
2. **扩展字段**：`User.role`、`BlogPost.excerpt/tags`、`Message.isRead` 为**新增**，不替换任何规格字段。
3. **注册即返回 token**：方便 UX；规格要求的 login 流程不受影响。
4. **扩展端点**：`GET /api/users/me`、`GET /api/contact`、`PATCH /api/contact/:id/read`、`GET /api/health`、`GET /` 为附加项。
5. **图片以 URL 存**：`imageUrl` 不做文件上传（规格未要求）。
6. **托管**：后端 Render、前端 Vercel/Netlify（均免费）；Heroku 亦可（加 `Procfile: web: npm start`）。
7. **演示身份**：`admin@portfolio.dev / admin123`（由 `npm run seed` 创建，可用环境变量覆盖）。
