# Full-Stack Portfolio & Blog

Capstone project for **Web Data Management and Application**.

Student: **Yang Zhenshen**

A personal portfolio and blog built as two applications:

- `server/` — REST API: Node.js, Express, MongoDB Atlas, Mongoose, bcrypt, JWT, helmet, dotenv.
- `client/` — Single Page Application: React, React Router, Context API, Tailwind CSS, Vite.

---

## Live URLs

| Component | URL |
|---|---|
| Front-end | https://capstone-portfolio-3wp6.onrender.com |
| Back-end | https://wdm-capstone-project.onrender.com |
| Health check | https://wdm-capstone-project.onrender.com/api/health |

The front-end is built with `VITE_API_URL` pointing at the back-end above, so it only calls that API.

> The back-end runs on a free Render instance, which sleeps after 15 minutes of inactivity. The first request after a period of inactivity may take up to 50 seconds.

## Demo account

```
email:    admin@portfolio.dev
password: admin123
```

---

## Structure

```
server/
  server.js          entry point
  app.js             middleware, routes, error handling
  config/db.js       MongoDB connection
  models/            User, Project, BlogPost, Comment, Message
  controllers/       request handlers
  routes/            URL -> middleware -> controller
  middleware/        protect, authorize, validation, error handler
  scripts/           seed.js, smoke-test.js

client/
  src/api/client.js      fetch wrapper, one function per endpoint
  src/context/           AuthContext, ThemeContext, ToastContext
  src/components/        Header, Footer, ProjectCard, BlogPostCard,
                         ProtectedRoute, CommentForm, CommentList, ...
  src/pages/             Home, Projects, Blog, BlogDetail, Contact,
                         Login, Register, AdminDashboard, NotFound
  src/data/site.js       name, email and links used across the site
```

Models, routes and controllers are kept separate so each layer has one job: models define the schema and validation, controllers hold the logic, routes map a method and path to a chain of middleware and a controller.

---

## Models

All schemas use `timestamps: true`.

| Model | Fields |
|---|---|
| **User** | `username` (String, required, unique), `email` (String, required, unique), `password` (String, required, minlength 6, bcrypt hash), `role` (String, default `admin`) |
| **Project** | `title` (required), `description` (required), `imageUrl`, `repoUrl`, `liveUrl` (optional), `user` (ObjectId, ref User, required) |
| **BlogPost** | `title` (required), `content` (required), `author` (ObjectId, ref User, required), `excerpt`, `tags` (optional) |
| **Comment** | `body` (required), `author` (ObjectId, ref User, required), `post` (ObjectId, ref BlogPost, required) |
| **Message** | `name` (required), `email` (required), `message` (required) |

Relations:

```
User     -> Project     Project.user
User     -> BlogPost    BlogPost.author
User     -> Comment     Comment.author
BlogPost -> Comment     Comment.post
```

`BlogPost` also declares a `comments` virtual, so `GET /api/blog/:id` can populate a post's comments in one query.

---

## API Endpoints

Base URL: `https://wdm-capstone-project.onrender.com`

Protected endpoints need the header `Authorization: Bearer <token>`.

Success responses look like `{ "success": true, "data": ... }`. Errors look like `{ "success": false, "message": "..." }`.

Fields marked `*` are required.

### Users

| Method | Endpoint | Access | Body | Response |
|---|---|---|---|---|
| POST | `/api/users/register` | Public | `{ username*, email*, password* }` | `201` — `{ token, user }` |
| POST | `/api/users/login` | Public | `{ email*, password* }` | `200` — `{ token, user }` |
| GET | `/api/users/me` | Protected | — | `200` — the logged-in user |

### Projects

| Method | Endpoint | Access | Body / Params | Response |
|---|---|---|---|---|
| GET | `/api/projects` | Public | — | `200` — all projects, owner populated with `username` |
| GET | `/api/projects/:id` | Public | param `id` | `200` — one project |
| POST | `/api/projects` | Protected | `{ title*, description*, imageUrl?, repoUrl?, liveUrl? }` | `201` — created project, `user` set to `req.user` |
| PUT | `/api/projects/:id` | Protected | param `id`, any of the fields above | `200` — updated project |
| DELETE | `/api/projects/:id` | Protected | param `id` | `200` |

### Blog

| Method | Endpoint | Access | Body / Params | Response |
|---|---|---|---|---|
| GET | `/api/blog` | Public | — | `200` — all posts, `author` populated with `username` |
| GET | `/api/blog/:id` | Public | param `id` | `200` — one post with `author.username` and its comments |
| POST | `/api/blog` | Protected | `{ title*, content*, excerpt?, tags? }` | `201` — created post, `author` set to `req.user` |
| PUT | `/api/blog/:id` | Protected, author only | param `id`, `{ title?, content?, excerpt?, tags? }` | `200`, or `403` if the user is not the author |
| DELETE | `/api/blog/:id` | Protected, author only | param `id` | `200`, or `403` if the user is not the author |

### Comments

| Method | Endpoint | Access | Body / Params | Response |
|---|---|---|---|---|
| GET | `/api/blog/:postId/comments` | Public | param `postId` | `200` — comments of that post, `author` populated with `username` |
| POST | `/api/blog/:postId/comments` | Protected | param `postId`, `{ body* }` | `201` — created comment |

### Contact

| Method | Endpoint | Access | Body | Response |
|---|---|---|---|---|
| POST | `/api/contact` | Public | `{ name*, email*, message* }` | `201` — message saved |
| GET | `/api/contact` | Protected | — | `200` — all messages (admin inbox) |
| PATCH | `/api/contact/:id/read` | Protected | param `id` | `200` — message marked as read |

### Utility

| Method | Endpoint | Access | Response |
|---|---|---|---|
| GET | `/api/health` | Public | `200` — uptime and status |
| GET | `/` | Public | `200` — list of routes |

### Example

```bash
TOKEN=$(curl -s -X POST https://wdm-capstone-project.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portfolio.dev","password":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -X POST https://wdm-capstone-project.onrender.com/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My App","description":"A full-stack application"}'
```

On Windows, `curl` in PowerShell is an alias for `Invoke-WebRequest`. Use `curl.exe`, or:

```powershell
$body = @{ email = "admin@portfolio.dev"; password = "admin123" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Uri "https://wdm-capstone-project.onrender.com/api/users/login" -Body $body
$headers = @{ Authorization = "Bearer $($login.token)" }
```

---

## Running locally

Requirements: Node.js 18 or later, npm, and a MongoDB Atlas cluster.

### 1. Back-end

```bash
cd server
npm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/capstone?retryWrites=true&w=majority
JWT_SECRET=<a random string of at least 32 characters>
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

In MongoDB Atlas, create a database user and add `0.0.0.0/0` to Network Access. The password must be URL-encoded if it contains `@`, `#` or `:`.

Start the API:

```bash
npm run dev        # http://localhost:5000
```

Optional: load sample data with `npm run seed`, then check every endpoint with `npm run smoke`.

### 2. Front-end

```bash
cd client
npm install
cp .env.example .env.local   # Windows: Copy-Item .env.example .env.local
```

Edit `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

Start the app:

```bash
npm run dev        # http://localhost:5173
```

`src/api/client.js` reads `VITE_API_URL` and appends `/api/...` to it. Use the URL without a trailing slash and without `/api`. Vite reads this value when the app is built or the dev server starts, so restart the server after changing it.

### 3. Deployment

Both services are deployed from this repository on Render:

- **Back-end** — Web Service, root directory `server`, build `npm install`, start `npm start`. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV=production`, `ALLOWED_ORIGINS` set to the front-end URL. Do not set `PORT`; Render provides it.
- **Front-end** — Static Site, root directory `client`, build `npm run build`, publish directory `dist`, environment variable `VITE_API_URL` set to the back-end URL. The rewrite rule in `render.yaml` sends all paths to `index.html` so client-side routes work on refresh.

After the front-end URL is known, add it to the back-end's `ALLOWED_ORIGINS` and redeploy the API.

---

## Notes

- Passwords are hashed with bcrypt before saving. The hash is never returned by the API.
- JWTs are signed with `JWT_SECRET` and contain the user id. The `protect` middleware verifies the token and attaches the user to `req.user`.
- Only the author of a blog post can update or delete it. Project writes require the `admin` role, which every registered account has by default.
- All errors are returned in the same JSON shape by one error handler in `middleware/errorMiddleware.js`.
- `helmet` sets security headers, `dotenv` keeps the connection string and JWT secret out of the repository, and CORS is limited to the origins in `ALLOWED_ORIGINS`.
