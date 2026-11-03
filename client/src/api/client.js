/**
 * src/api/client.js
 * ---------------------------------------------------------------------------
 * The SINGLE place where the front-end talks to the back-end.
 *
 * API base URL resolution (deployment requirement: the deployed SPA must talk
 * to the DEPLOYED API only):
 *   1. import.meta.env.VITE_API_URL   -> set in .env.local (dev) and in the
 *                                        Vercel/Netlify build environment.
 *   2. fallback: http://localhost:5000 -> local development default only.
 *
 * Every helper returns the parsed JSON body and throws an ApiError on !res.ok,
 * so pages only need try/catch + setError(e.message).
 * ---------------------------------------------------------------------------
 */

const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Trailing slash removal => `${API_BASE}/api/...` never becomes `//api/...`. */
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** Where the JWT lives in the browser. Shared by client.js and AuthContext. */
export const TOKEN_STORAGE_KEY = 'capstone_token';

/** Error type so callers can inspect `err.status` (e.g. 401). */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/* ===========================================================================
   Token holder
   The fetch wrapper never uses a stale closure: AuthContext registers the
   CURRENT token here ("setAuthToken") and every protected request reads it.
   =========================================================================== */
let authToken = null;
export const setAuthToken = (token) => {
  authToken = token || null;
};

/**
 * Core fetch wrapper.
 * @param {string} path    e.g. '/api/blog/123'
 * @param {object} options { method, body, token, signal, headers }
 */
export async function request(path, { method = 'GET', body, token, signal, headers = {} } = {}) {
  // 1) Build headers. The JWT is injected ONLY here, which guarantees that every
  //    protected Admin Dashboard request carries "Authorization: Bearer <token>".
  const bearer = token || authToken;
  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (bearer) finalHeaders.Authorization = `Bearer ${bearer}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') throw networkErr;
    // fetch() only rejects on network/CORS failures — a very common pitfall.
    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. ` +
        'Is the back-end running? Is ALLOWED_ORIGINS configured to include this site?',
      0
    );
  }

  // 2) Parse JSON safely (a 500 HTML page would otherwise crash JSON.parse).
  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text.slice(0, 300) };
    }
  }

  // 3) Normalise errors: our API always returns { success:false, message }.
  if (!res.ok) {
    const message =
      payload?.message ||
      (res.status === 401
        ? 'Not authorized — please log in.'
        : `Request failed with status ${res.status}`);
    throw new ApiError(message, res.status, payload);
  }

  return payload;
}

/* ===========================================================================
   API surface — one function per back-end endpoint (mirrors the routes 1:1).
   Protected calls do not pass a token explicitly: the wrapper uses the token
   registered by AuthContext, so the Authorization header is always present
   while the user is logged in.
   =========================================================================== */

export const api = {
  // ---- Auth (Phase 2) ----
  register: (data) => request('/api/users/register', { method: 'POST', body: data }),
  login: (data) => request('/api/users/login', { method: 'POST', body: data }),
  me: (signal) => request('/api/users/me', { signal }),

  // ---- Projects ----
  getProjects: (signal) => request('/api/projects', { signal }),
  getProject: (id, signal) => request(`/api/projects/${id}`, { signal }),
  createProject: (data) => request('/api/projects', { method: 'POST', body: data }),
  updateProject: (id, data) => request(`/api/projects/${id}`, { method: 'PUT', body: data }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),

  // ---- Blog ----
  getPosts: (signal) => request('/api/blog', { signal }),
  getPost: (id, signal) => request(`/api/blog/${id}`, { signal }),
  createPost: (data) => request('/api/blog', { method: 'POST', body: data }),
  updatePost: (id, data) => request(`/api/blog/${id}`, { method: 'PUT', body: data }),
  deletePost: (id) => request(`/api/blog/${id}`, { method: 'DELETE' }),

  // ---- Comments ----
  getComments: (postId, signal) => request(`/api/blog/${postId}/comments`, { signal }),
  createComment: (postId, data) =>
    request(`/api/blog/${postId}/comments`, { method: 'POST', body: data }),

  // ---- Contact ----
  sendContact: (data) => request('/api/contact', { method: 'POST', body: data }),
  getMessages: () => request('/api/contact'),
};
