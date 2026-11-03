# Full-Stack Personal Portfolio & Blog — Capstone Project

> A production-ready personal portfolio website built as a **Node.js + Express + MongoDB Atlas REST API** and a **React Single Page Application** (React Router + Context API + Tailwind CSS), with JWT authentication, an author-protected blog, nested comments, a public contact form and a secure Admin Dashboard.

---

## 1. Project Overview

This capstone project is a complete full-stack application in two parts:

| Component | Stack | Responsibility |
|---|---|---|
| **Back-end API** (`/server`) | Node.js, Express, MongoDB Atlas, Mongoose, bcrypt, JWT, helmet, dotenv | The "brain": stores projects, blog posts, comments, users and contact messages. Implements MVC, authentication, authorization and central error handling. |
| **Front-end SPA** (`/client`) | React 18, React Router v6, Context API, Tailwind CSS, Vite | The user interface: consumes every back-end endpoint, has public pages, authentication flows and a protected Admin Dashboard. |

### Features

- **MVC back-end** with a clear separation of `models / routes / controllers / middleware / config`.
- **Five Mongoose models** — `User`, `Project`, `BlogPost`, `Comment`, `Message` — with schema validation and `ref` relationships.
- **Authentication** — bcrypt password hashing, JWT generation containing the user ID, and a `protect` middleware that attaches `req.user`.
- **Authorization** — only the **original author** can update or delete a blog post (`403` otherwise); a `role` field backs the spec's "projects are admin-only" assumption.
- **Relationships** — `populate()` resolves an author's `username` on blog lists/details/comments, and a Mongoose **virtual populate** returns all comments of a post.
- **Central error handling** — every error (validation, cast, duplicate key, invalid/expired JWT, 404) becomes the same JSON shape: `{ "success": false, "message": "…" }`.
- **Security** — `helmet` headers, `dotenv` secrets, CORS allow-list, rate limiting on auth endpoints.
- **SPA** — 8 routes (`/`, `/projects`, `/blog`, `/blog/:id`, `/contact`, `/login`, `/register`, and the protected `/admin`), a responsive auth-aware header, loading/error/empty states, controlled forms, toast notifications, and a full CRUD Admin Dashboard for Projects **and** Blog posts.
- **Responsive** — mobile-first layout with a hamburger drawer, verified from 390 px to desktop widths.

---

## 2. Live URLs

| Deployment | URL |
|---|---|
| **Live Front-End (SPA)** | `https://YOUR-PROJECT.vercel.app` |
| **Live Back-End (API)** | `https://YOUR-PROJECT-api.onrender.com` |
| API health check | `https://YOUR-PROJECT-api.onrender.com/api/health` |
| API root (endpoint index) | `https://YOUR-PROJECT-api.onrender.com/` |

> Replace the two URLs above with your real deployment links before submitting to Chaoxing.
> The deployed front-end is configured (via the `VITE_API_URL` build variable) to talk **only** to the deployed back-end.

---

## 3. Project Structure

```
Capstone Project/
├── README.md
├── package.json                  # convenience scripts for the whole repo
├── .gitignore
├── server/                       # ---------- BACK-END ----------
│   ├── server.js                 # entry: dotenv -> validate env -> connect DB -> listen
│   ├── app.js                    # Express app: helmet, cors, parsers, routes, 404, errors
│   ├── package.json
│   ├── .env.example              # template for secrets (copy to .env)
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connection
│   ├── models/                   # M — Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── BlogPost.js
│   │   ├── Comment.js
│   │   └── Message.js
│   ├── controllers/              # C — request handlers (business logic)
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── blogController.js
│   │   ├── commentController.js
│   │   └── contactController.js
│   ├── routes/                   # URL -> middleware -> controller
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── blogRoutes.js
│   │   └── contactRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect (JWT) + authorize(role)
│   │   ├── errorMiddleware.js    # AppError, asyncHandler, notFound, errorHandler
│   │   └── validate.js           # request body validator
│   └── scripts/
│       ├── seed.js               # demo data (admin user, projects, posts, comments)
│       └── smoke-test.js         # 34-check end-to-end test of every endpoint
└── client/                       # ---------- FRONT-END ----------
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vercel.json               # SPA rewrites for Vercel
    ├── netlify.toml              # SPA redirects for Netlify
    ├── .env.example              # VITE_API_URL
    ├── index.html
    └── src/
        ├── main.jsx              # ReactDOM root + providers (Router > Auth > Toast)
        ├── App.jsx               # ALL routes (public + protected)
        ├── index.css             # Tailwind + component classes
        ├── api/
        │   └── client.js         # fetch wrapper + one function per endpoint
        ├── context/
        │   ├── AuthContext.jsx   # token, user, login, register, logout, localStorage
        │   └── ToastContext.jsx  # global notifications
        ├── components/
        │   ├── Header.jsx        # auth-aware navbar
        │   ├── Footer.jsx
        │   ├── ProjectCard.jsx
        │   ├── BlogPostCard.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── CommentForm.jsx
        │   ├── CommentList.jsx
        │   ├── Loader.jsx        # Loading / Error / Empty states
        │   ├── Modal.jsx
        │   ├── ConfirmDialog.jsx
        │   └── ScrollToTop.jsx
        └── pages/
            ├── Home.jsx          # /
            ├── Projects.jsx      # /projects
            ├── Blog.jsx          # /blog
            ├── BlogDetail.jsx    # /blog/:id
            ├── Contact.jsx       # /contact
            ├── Login.jsx         # /login
            ├── Register.jsx      # /register
            ├── AdminDashboard.jsx# /admin  (protected)
            └── NotFound.jsx      # *
```

### MVC responsibilities (back-end)

| Layer | Folder | Job | Does **not** do |
|---|---|---|---|
| **Model** | `models/` | Defines the schema, field types, validators (`required`, `unique`, `minlength`), relationships (`ref`) and hooks (bcrypt pre-save). | Parse HTTP, send responses. |
| **Controller** | `controllers/` | Reads `req`, applies rules (ownership, hashing, `populate`), talks to models, sends `res.status(...).json(...)`. | Define URLs, declare middleware order. |
| **Route** | `routes/` | Maps METHOD + path to middleware chain (`protect` → `validate` → controller). | Contain business logic. |
| **Middleware** | `middleware/` | Cross-cutting concerns: authentication, authorization, validation, error normalisation. | Know about specific models (except `protect`, which loads the user). |
| **Config** | `config/` | Infrastructure: database connection. | Domain logic. |

---

## 4. Database Models

All models live in `server/models/`. `timestamps: true` auto-generates `createdAt` / `updatedAt`.

### User (`users`)

| Field | Type | Validation |
|---|---|---|
| `username` | String | **required**, **unique**, trim, minlength 3, maxlength 30 |
| `email` | String | **required**, **unique**, lowercase, regex match |
| `password` | String | **required**, **minlength 6**, `select: false`, bcrypt-hashed |
| `role` | String | enum `admin` \| `user`, default `admin` *(assumption — see §9)* |
| `createdAt`, `updatedAt` | Date | auto |

### Project (`projects`)

| Field | Type | Validation |
|---|---|---|
| `title` | String | **required**, maxlength 120 |
| `description` | String | **required**, maxlength 2000 |
| `imageUrl` | String | *optional*, default `''` |
| `repoUrl` | String | *optional*, default `''` |
| `liveUrl` | String | *optional*, default `''` |
| `user` | ObjectId | **required**, `ref: 'User'` |
| `createdAt`, `updatedAt` | Date | auto |

### BlogPost (`blogposts`)

| Field | Type | Validation |
|---|---|---|
| `title` | String | **required**, maxlength 150 |
| `content` | String | **required** |
| `author` | ObjectId | **required**, `ref: 'User'` |
| `excerpt` | String | optional (UI preview) |
| `tags` | [String] | optional (UI filter) |
| `comments` | *virtual* | `ref: 'Comment'`, local `_id` → foreign `post` |
| `createdAt`, `updatedAt` | Date | auto |

### Comment (`comments`)

| Field | Type | Validation |
|---|---|---|
| `body` | String | **required**, minlength 1, maxlength 1000 |
| `author` | ObjectId | **required**, `ref: 'User'` |
| `post` | ObjectId | **required**, `ref: 'BlogPost'` |
| `createdAt`, `updatedAt` | Date | auto |

### Message (`messages`)

| Field | Type | Validation |
|---|---|---|
| `name` | String | **required**, maxlength 80 |
| `email` | String | **required**, regex match |
| `message` | String | **required**, minlength 5, maxlength 2000 |
| `isRead` | Boolean | default `false` |
| `createdAt`, `updatedAt` | Date | auto |

**Relationships**

```
User 1 ──< many Project      (Project.user      -> User._id)
User 1 ──< many BlogPost     (BlogPost.author   -> User._id)
User 1 ──< many Comment      (Comment.author    -> User._id)
BlogPost 1 ──< many Comment  (Comment.post      -> BlogPost._id)   [virtual: BlogPost.comments]
```

---

## 5. API Endpoints

**Base URL:** `https://YOUR-PROJECT-api.onrender.com` (live) or `http://localhost:5000` (local).
All requests and responses are `application/json`.
Protected routes require the header `Authorization: Bearer <token>`.

**Success shape:** `{ "success": true, "data": … }` (+ `message`, sometimes `count`/`token`)
**Error shape:** `{ "success": false, "message": "…" }` (+ `errors[]` for field-level validation failures)

### 5.1 Authentication — `/api/users`

| # | Method | Endpoint | Access | Purpose | Body / Params | Success |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/users/register` | Public | Create a user; password hashed with bcrypt; returns a JWT so the user is logged in immediately | `{ "username": "alex", "email": "alex@example.com", "password": "secret123" }` | `201` → `{ success, token, user:{_id,username,email,role} }` |
| 2 | POST | `/api/users/login` | Public | Authenticate with email + password; `bcrypt.compare`, returns JWT containing the user id | `{ "email": "alex@example.com", "password": "secret123" }` | `200` → `{ success, token, user }` |
| 3 | GET | `/api/users/me` | Protected | Return the current user (used by the SPA to validate a stored token) | header `Authorization: Bearer <token>` | `200` → `{ success, data: user }` |

### 5.2 Projects — `/api/projects`

| # | Method | Endpoint | Access | Purpose | Body / Params | Success |
|---|---|---|---|---|---|---|
| 4 | GET | `/api/projects` | Public | All projects, newest first, owner `user` populated (`username`, `email`) | — | `200` → `{ success, count, data: Project[] }` |
| 5 | GET | `/api/projects/:id` | Public | A single project by ObjectId | param `id` | `200` → `{ success, data: Project }` · `404` if missing · `400` if malformed id |
| 6 | POST | `/api/projects` | Protected (admin only) | Create a project owned by `req.user` | `{ title*, description*, imageUrl?, repoUrl?, liveUrl? }` | `201` → `{ success, data: Project }` |
| 7 | PUT | `/api/projects/:id` | Protected (admin only) | Update a project (partial body allowed) | param `id`; body: any of `title, description, imageUrl, repoUrl, liveUrl` | `200` → `{ success, data: Project }` |
| 8 | DELETE | `/api/projects/:id` | Protected (admin only) | Delete a project | param `id` | `200` → `{ success, data: { _id } }` |

### 5.3 Blog — `/api/blog`

| # | Method | Endpoint | Access | Purpose | Body / Params | Success |
|---|---|---|---|---|---|---|
| 9 | GET | `/api/blog` | Public | All posts, newest first, `author` populated with **`username`** only | — | `200` → `{ success, count, data: BlogPost[] }` |
| 10 | GET | `/api/blog/:id` | Public | One post with `author.username` **and all its comments** (each with `author.username`) | param `id` | `200` → `{ success, data: { …post, comments: Comment[] } }` |
| 11 | POST | `/api/blog` | Protected | Create a post; `author = req.user._id` | `{ title*, content*, excerpt?, tags?: [] }` | `201` → `{ success, data: BlogPost }` |
| 12 | PUT | `/api/blog/:id` | Protected + **author only** | Update a post. A different logged-in user gets `403` | param `id`; body: `title?, content?, excerpt?, tags?` | `200` → `{ success, data }` · `403` if not the author |
| 13 | DELETE | `/api/blog/:id` | Protected + **author only** | Delete a post **and its comments** | param `id` | `200` → `{ success, data: { _id } }` · `403` if not the author |

### 5.4 Comments (nested under a post) — `/api/blog/:postId/comments`

| # | Method | Endpoint | Access | Purpose | Body / Params | Success |
|---|---|---|---|---|---|---|
| 14 | GET | `/api/blog/:postId/comments` | Public | All comments of one post, oldest first, `author.username` populated | param `postId` | `200` → `{ success, count, data: Comment[] }` |
| 15 | POST | `/api/blog/:postId/comments` | Protected | Create a comment: `post = :postId`, `author = req.user._id` | param `postId`; `{ "body": "Great post!" }` | `201` → `{ success, data: Comment }` |

### 5.5 Contact & utility

| # | Method | Endpoint | Access | Purpose | Body / Params | Success |
|---|---|---|---|---|---|---|
| 16 | POST | `/api/contact` | Public | Save the portfolio contact form as a `Message` | `{ name*, email*, message* }` | `201` → `{ success, message, data:{ id, createdAt } }` |
| 17 | GET | `/api/contact` | Protected | Admin inbox — all messages, newest first *(extra)* | header `Authorization` | `200` → `{ success, count, data: Message[] }` |
| 18 | PATCH | `/api/contact/:id/read` | Protected | Mark a message as read *(extra)* | param `id` | `200` → `{ success, data }` |
| 19 | GET | `/api/health` | Public | Health check / uptime *(extra)* | — | `200` → `{ success, status, uptime }` |
| 20 | GET | `/` | Public | API index / endpoint map *(extra)* | — | `200` → `{ success, message, endpoints }` |

`*` = required. Rows **1–16** cover every endpoint required by the specification (register, login, 5 project endpoints, 4 blog endpoints, 2 comment endpoints, 1 contact endpoint, plus the `me` helper); rows 17–20 are optional conveniences.

### 5.6 Example requests

```bash
# Register (bash / macOS / Linux)
curl -X POST https://YOUR-API.onrender.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alex","email":"alex@example.com","password":"secret123"}'

# Login and capture the token
TOKEN=$(curl -s -X POST https://YOUR-API.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"secret123"}' | jq -r .token)

# Create a project (protected)
curl -X POST https://YOUR-API.onrender.com/api/projects \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My App","description":"A full-stack app","liveUrl":"https://example.com"}'

# Public blog list with populated author username
curl https://YOUR-API.onrender.com/api/blog

# Post a comment (protected)
curl -X POST https://YOUR-API.onrender.com/api/blog/<POST_ID>/comments \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"body":"Nice article!"}'
```

> **PowerShell users:** use `Invoke-RestMethod` instead of `curl`:
> ```powershell
> Invoke-RestMethod -Method Post -Uri "$API/api/users/login" -ContentType "application/json" `
>   -Body (@{ email="alex@example.com"; password="secret123" } | ConvertTo-Json)
> ```

### 5.7 `populate()` usage

```js
// Blog list — only the author's username (spec: "populated with the author's username")
const posts = await BlogPost.find({})
  .populate('author', 'username')
  .sort({ createdAt: -1 });

// Blog detail — author username + every comment (nested/virtual populate)
const post = await BlogPost.findById(id)
  .populate('author', 'username')
  .populate({
    path: 'comments',
    select: 'body author createdAt',
    options: { sort: { createdAt: 1 } },
    populate: { path: 'author', select: 'username' },
  });

// Comments — which user wrote each comment
await Comment.find({ post: postId }).populate('author', 'username');
```

**Common pitfalls:** forgetting the projection (`'.populate("author")'` leaks the whole user document), naming the wrong path (must match the schema field), and calling `.populate()` on a virtual that is not defined in the schema (`BlogPost.comments`).

---

## 6. Run Locally

### Prerequisites

- **Node.js ≥ 18** (uses the built-in global `fetch` for the smoke test) and npm
- A **MongoDB Atlas** account with a free cluster (or a local `mongod`)

### Step 0 — Install dependencies

```bash
cd "Capstone Project"

# one command for both apps (from the root package.json):
npm run install:all

# or individually:
cd server && npm install
cd ../client && npm install
```

### Step 1 — MongoDB Atlas

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP `0.0.0.0/0` (required for Render/Heroku/Vercel — their IPs are not static).
4. **Connect → Drivers** → copy the connection string.

### Step 2 — Back-end environment variables

```bash
cd server
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/capstone?retryWrites=true&w=majority
JWT_SECRET=<a random string of at least 32 characters>
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Step 3 — Start the API

```bash
cd server
npm run dev        # http://localhost:5000  (auto-restarts on change)
# or: npm start
```

Check it: open <http://localhost:5000/api/health> → `{"success":true,"status":"ok",...}`

### Step 4 — Seed demo data (recommended before the demo)

```bash
cd server
npm run seed             # creates admin user + 3 projects + 2 posts + 4 comments
# npm run seed -- --wipe # clears Projects/Posts/Comments first
```

Demo login: **`admin@portfolio.dev` / `admin123`** (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

### Step 5 — Front-end environment variables

```bash
cd client
cp .env.example .env.local    # Windows: Copy-Item .env.example .env.local
```

```env
VITE_API_URL=http://localhost:5000
```

⚠️ This is **how the front-end connects to the back-end**: `src/api/client.js` reads `import.meta.env.VITE_API_URL` and appends `/api/...` to it. If you change the API port, change this value too and **restart** `npm run dev` (Vite only reads env files at startup).

### Step 6 — Start the SPA

```bash
cd client
npm run dev        # http://localhost:5173
```

Open <http://localhost:5173>. The header shows **Login / Register**; after logging in it shows **Admin Dashboard** + **Logout**.

### Step 7 — Verify everything (optional but recommended)

```bash
cd server
npm run smoke      # 34 end-to-end checks against http://localhost:5000
# against the deployed API:
# PowerShell:  $env:API_BASE="https://YOUR-API.onrender.com"; npm run smoke
```

### Quick reference

| App | Command | URL |
|---|---|---|
| API | `cd server && npm run dev` | http://localhost:5000 |
| SPA | `cd client && npm run dev` | http://localhost:5173 |
| Build SPA | `cd client && npm run build` | output in `client/dist` |

---

## 7. Deployment

### 7.1 Back-end → Render (free tier)

1. Push the repository to GitHub.
2. <https://render.com> → **New → Web Service** → connect the repo.
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. **Environment → Add Environment Variables:**

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRE` | `30d` |
   | `NODE_ENV` | `production` |
   | `ALLOWED_ORIGINS` | your Vercel/Netlify URL, e.g. `https://your-project.vercel.app` (no trailing slash; add more separated by commas) |

   *(Do **not** set `PORT` — Render injects it.)*
5. Deploy, then verify `https://your-api.onrender.com/api/health`.

> **Free-tier note:** Render free instances sleep after ~15 minutes of inactivity. **Open the API URL ~1 minute before your demo** so it is awake.

### 7.2 Front-end → Vercel (or Netlify)

**Vercel**

1. <https://vercel.com> → **Add New → Project** → import the repo.
2. **Root Directory:** `client` · **Framework Preset:** Vite · **Build Command:** `npm run build` · **Output Directory:** `dist`.
3. **Environment Variables** → `VITE_API_URL` = `https://your-api.onrender.com` (**no trailing slash, no `/api`**).
4. Deploy. `client/vercel.json` already provides the SPA rewrite so deep links such as `/blog/:id` and `/admin` survive a refresh.
5. **Go back to Render** and add this Vercel URL to `ALLOWED_ORIGINS`, then redeploy the API so CORS allows it.

**Netlify**

1. <https://app.netlify.com> → **Add new site → Import an existing project**.
2. **Base directory:** `client` · **Build command:** `npm run build` · **Publish directory:** `client/dist`.
3. Site settings → **Environment variables** → `VITE_API_URL` = your live API URL.
4. `client/netlify.toml` provides the `/* → /index.html` redirect (status 200).

> ⚠️ `VITE_*` variables are inlined at **build time**. If you change `VITE_API_URL`, you must **redeploy** the front-end.

---

## 8. Security Notes

| Concern | Implementation |
|---|---|
| Password storage | bcrypt (10 salt rounds) in `userController.registerUser`, plus a pre-save safety net in `models/User.js`. Hashes never serialised (`select: false` + `toJSON` transform). |
| Session | JWT signed with `JWT_SECRET`, payload `{ id }`, expiry `JWT_EXPIRE`. |
| Protected routes | `protect` middleware verifies the token and loads `req.user` from the DB on every request. |
| Blog authorization | `post.author.equals(req.user._id)` before PUT/DELETE → `403` for non-authors. |
| Headers | `helmet()` on every response. |
| Secrets | `dotenv`; `.env` is git-ignored and only `.env.example` is committed. |
| CORS | Allow-list from `ALLOWED_ORIGINS`; unknown origins are rejected. |
| Abuse | `express-rate-limit`: 30 auth attempts / 10 min / IP; 300 API requests / 15 min / IP. |
| Errors | No stack traces in production; generic "Invalid email or password" for login failures. |

---

## 9. Assumptions

1. **Admin-only projects** — the spec states project management is "assumed to be admin-only". Every registered account gets `role: 'admin'` (single-owner portfolio), and project write routes additionally pass `authorize('admin')`. If you need many contributors, change the default in `models/User.js` to `'user'` and promote the owner manually.
2. **Optional extras** — `excerpt`/`tags` on `BlogPost`, `isRead` on `Message`, `role` on `User`, `GET /api/users/me`, `GET /api/contact`, `/api/health` and `/` are **additions**; none replaces a required field or endpoint.
3. **Register returns a token** — convenient UX; the graded flow (`POST /register` then `POST /login`) still works because login also returns a JWT.
4. **Images are URLs** — `imageUrl` stores a URL; there is no file upload (not required by the spec).
5. **Hosting** — Render (back-end) + Vercel/Netlify (front-end), both free tiers. Heroku also works: same env vars + a `Procfile` containing `web: npm start`.

---

## 10. Submission Checklist (Chaoxing)

- [ ] Live **front-end** URL
- [ ] Live **back-end** URL
- [ ] `StudentID_StudentName_CapstoneProject.zip` containing `server/` + `client/` + `README.md` (**no `node_modules`**)
- [ ] This `README.md`

---

## 11. License

MIT — created for academic assessment.
