/**
 * scripts/smoke-test.js
 * ---------------------------------------------------------------------------
 * END-TO-END proof that every graded endpoint works, against a REAL running API.
 * Uses only Node's built-in fetch (Node >= 18) — no extra dependency.
 *
 * Run:
 *   Terminal 1:  npm start
 *   Terminal 2:  API_BASE=http://localhost:5000 npm run smoke
 *   Against the live API:  API_BASE=https://your-api.onrender.com npm run smoke
 *
 * It prints a PASS/FAIL table you can screenshot for the report.
 * NOTE: it creates one user + one project + one post + one comment + one message.
 * ---------------------------------------------------------------------------
 */
const BASE = (process.env.API_BASE || 'http://localhost:5000').replace(/\/$/, '');

let pass = 0;
let fail = 0;
const results = [];

const check = (name, ok, detail = '') => {
  if (ok) pass += 1;
  else fail += 1;
  results.push({ name, ok, detail });
  // eslint-disable-next-line no-console
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ->  ${detail}` : ''}`);
};

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    json = null;
  }
  return { status: res.status, body: json };
};

const stamp = Date.now();

const run = async () => {
  // eslint-disable-next-line no-console
  console.log(`\n=== Capstone API smoke test against ${BASE} ===\n`);

  // 1. Health
  const health = await api('GET', '/api/health');
  check('GET /api/health -> 200', health.status === 200, `status=${health.status}`);

  // 2. Register
  const emailA = `smoke_a_${stamp}@example.com`;
  const regA = await api('POST', '/api/users/register', {
    body: { username: `smokeA_${stamp}`, email: emailA, password: 'secret123' },
  });
  check(
    'POST /api/users/register -> 201 + token',
    regA.status === 201 && !!regA.body?.token,
    `status=${regA.status}`
  );
  check(
    'register response never contains password hash',
    !JSON.stringify(regA.body || {}).includes('$2a$') &&
      !JSON.stringify(regA.body || {}).includes('$2b$'),
    'checked response body'
  );

  // 3. Duplicate register -> 409
  const dup = await api('POST', '/api/users/register', {
    body: { username: `smokeA_${stamp}`, email: emailA, password: 'secret123' },
  });
  check('duplicate register -> 409', dup.status === 409, `status=${dup.status}`);

  // 4. Validation: short password -> 400
  const shortPw = await api('POST', '/api/users/register', {
    body: { username: `smokeB_${stamp}`, email: `smoke_b_${stamp}@example.com`, password: '123' },
  });
  check('register with 3-char password -> 400', shortPw.status === 400, `status=${shortPw.status}`);

  // 5. Login
  const loginA = await api('POST', '/api/users/login', {
    body: { email: emailA, password: 'secret123' },
  });
  check(
    'POST /api/users/login -> 200 + token',
    loginA.status === 200 && !!loginA.body?.token,
    `status=${loginA.status}`
  );
  const tokenA = loginA.body?.token;

  // 6. Wrong password -> 401
  const badLogin = await api('POST', '/api/users/login', {
    body: { email: emailA, password: 'wrong-password' },
  });
  check('login with wrong password -> 401', badLogin.status === 401, `status=${badLogin.status}`);

  // 7. Second user (for the authorization test)
  const emailB = `smoke_b2_${stamp}@example.com`;
  const regB = await api('POST', '/api/users/register', {
    body: { username: `smokeB2_${stamp}`, email: emailB, password: 'secret123' },
  });
  const tokenB = regB.body?.token;
  check('second register -> 201', regB.status === 201, `status=${regB.status}`);

  // 8. Projects — public reads, protected writes
  const emptyProjects = await api('GET', '/api/projects');
  check(
    'GET /api/projects (public) -> 200 + array',
    emptyProjects.status === 200 && Array.isArray(emptyProjects.body?.data),
    `status=${emptyProjects.status}`
  );

  const noTokenCreate = await api('POST', '/api/projects', {
    body: { title: 'Unauthorized', description: 'should fail' },
  });
  check('POST /api/projects without token -> 401', noTokenCreate.status === 401, `status=${noTokenCreate.status}`);

  const createProjectRes = await api('POST', '/api/projects', {
    token: tokenA,
    body: {
      title: `Smoke Project ${stamp}`,
      description: 'Created by the smoke test to prove protected CRUD works.',
      imageUrl: 'https://picsum.photos/600/400',
      repoUrl: 'https://github.com/example/repo',
      liveUrl: 'https://example.com',
    },
  });
  const projectId = createProjectRes.body?.data?._id;
  check(
    'POST /api/projects with token -> 201 + user associated',
    createProjectRes.status === 201 && !!projectId && !!createProjectRes.body?.data?.user,
    `status=${createProjectRes.status}`
  );

  const getProject = await api('GET', `/api/projects/${projectId}`);
  check(
    'GET /api/projects/:id -> 200 + populate(user)',
    getProject.status === 200 &&
      !!getProject.body?.data?.user?.username,
    `status=${getProject.status} author=${getProject.body?.data?.user?.username}`
  );

  const updateProjectRes = await api('PUT', `/api/projects/${projectId}`, {
    token: tokenA,
    body: { title: `Smoke Project ${stamp} (updated)` },
  });
  check(
    'PUT /api/projects/:id -> 200 + title changed',
    updateProjectRes.status === 200 &&
      updateProjectRes.body?.data?.title.includes('(updated)'),
    `status=${updateProjectRes.status}`
  );

  const badId = await api('GET', '/api/projects/not-an-object-id');
  check('GET /api/projects/bad-id -> 400 (CastError handled)', badId.status === 400, `status=${badId.status}`);

  const missingId = await api('GET', '/api/projects/650000000000000000000000');
  check('GET /api/projects/missing-id -> 404', missingId.status === 404, `status=${missingId.status}`);

  // 9. Blog — public reads, protected writes, author authorization
  const createPostRes = await api('POST', '/api/blog', {
    token: tokenA,
    body: {
      title: `Smoke Post ${stamp}`,
      content: 'A post created by the smoke test. '.repeat(3),
      tags: ['smoke', 'test'],
    },
  });
  const postId = createPostRes.body?.data?._id;
  check(
    'POST /api/blog with token -> 201 + author associated',
    createPostRes.status === 201 && !!postId && !!createPostRes.body?.data?.author?.username,
    `status=${createPostRes.status}`
  );

  const listPosts = await api('GET', '/api/blog');
  check(
    'GET /api/blog -> 200 + author username populated',
    listPosts.status === 200 &&
      (listPosts.body?.data || []).every((p) => p.author && p.author.username),
    `count=${listPosts.body?.count}`
  );

  // Comment BEFORE reading the detail, so the detail populate has something to show.
  const createCommentRes = await api('POST', `/api/blog/${postId}/comments`, {
    token: tokenA,
    body: { body: 'This is a smoke-test comment.' },
  });
  check(
    'POST /api/blog/:postId/comments with token -> 201',
    createCommentRes.status === 201 &&
      !!createCommentRes.body?.data?.author?.username,
    `status=${createCommentRes.status}`
  );

  const publicComment = await api('POST', `/api/blog/${postId}/comments`, {
    body: { body: 'anonymous comment should fail' },
  });
  check('POST comment without token -> 401', publicComment.status === 401, `status=${publicComment.status}`);

  const postDetail = await api('GET', `/api/blog/${postId}`);
  check(
    'GET /api/blog/:id -> 200 + author username + populated comments',
    postDetail.status === 200 &&
      !!postDetail.body?.data?.author?.username &&
      Array.isArray(postDetail.body?.data?.comments) &&
      postDetail.body.data.comments.length >= 1 &&
      !!postDetail.body?.data?.comments[0]?.author?.username,
    `status=${postDetail.status} comments=${postDetail.body?.data?.comments?.length}`
  );

  const getComments = await api('GET', `/api/blog/${postId}/comments`);
  check(
    'GET /api/blog/:postId/comments (public) -> 200 + author populated',
    getComments.status === 200 &&
      Array.isArray(getComments.body?.data) &&
      getComments.body.data.length >= 1 &&
      !!getComments.body.data[0].author?.username,
    `status=${getComments.status} count=${getComments.body?.count}`
  );

  // ---- AUTHORIZATION: user B must NOT be able to edit/delete user A's post ----
  const forbiddenUpdate = await api('PUT', `/api/blog/${postId}`, {
    token: tokenB,
    body: { title: 'Hacked by user B' },
  });
  check(
    'PUT /api/blog/:id by non-author -> 403',
    forbiddenUpdate.status === 403,
    `status=${forbiddenUpdate.status}`
  );

  const forbiddenDelete = await api('DELETE', `/api/blog/${postId}`, { token: tokenB });
  check(
    'DELETE /api/blog/:id by non-author -> 403',
    forbiddenDelete.status === 403,
    `status=${forbiddenDelete.status}`
  );

  // ---- The author CAN update ----
  const authorUpdate = await api('PUT', `/api/blog/${postId}`, {
    token: tokenA,
    body: { title: `Smoke Post ${stamp} (edited by author)` },
  });
  check(
    'PUT /api/blog/:id by author -> 200',
    authorUpdate.status === 200 && authorUpdate.body?.data?.title.includes('edited by author'),
    `status=${authorUpdate.status}`
  );

  // 10. Contact (public)
  const contact = await api('POST', '/api/contact', {
    body: {
      name: 'Smoke Tester',
      email: `smoke_${stamp}@example.com`,
      message: 'Hello from the automated smoke test.',
    },
  });
  check('POST /api/contact (public) -> 201', contact.status === 201, `status=${contact.status}`);

  const badContact = await api('POST', '/api/contact', {
    body: { name: 'No Email', email: 'not-an-email', message: 'abc' },
  });
  check('POST /api/contact invalid -> 400', badContact.status === 400, `status=${badContact.status}`);

  // 11. Protected-only read (admin inbox)
  const inboxNoAuth = await api('GET', '/api/contact');
  check('GET /api/contact without token -> 401', inboxNoAuth.status === 401, `status=${inboxNoAuth.status}`);

  const inbox = await api('GET', '/api/contact', { token: tokenA });
  check(
    'GET /api/contact with token -> 200 + saved message visible',
    inbox.status === 200 && (inbox.body?.data || []).length >= 1,
    `status=${inbox.status} count=${inbox.body?.count}`
  );

  // 12. 404 for unknown route (central error handler)
  const notFound = await api('GET', '/api/this-route-does-not-exist');
  check(
    'unknown route -> 404 JSON with {success:false,message}',
    notFound.status === 404 && notFound.body?.success === false,
    `status=${notFound.status}`
  );

  // 13. /api/users/me (protect middleware resolves req.user)
  const me = await api('GET', '/api/users/me', { token: tokenA });
  check(
    'GET /api/users/me -> 200 + correct user',
    me.status === 200 && me.body?.data?.email === emailA,
    `status=${me.status}`
  );

  const badToken = await api('GET', '/api/users/me', { token: 'garbage.token.value' });
  check('GET /api/users/me with invalid token -> 401', badToken.status === 401, `status=${badToken.status}`);

  // 14. Cleanup: delete the smoke project & post (also proves DELETE endpoints)
  const delPost = await api('DELETE', `/api/blog/${postId}`, { token: tokenA });
  check('DELETE /api/blog/:id by author -> 200', delPost.status === 200, `status=${delPost.status}`);

  const delProject = await api('DELETE', `/api/projects/${projectId}`, { token: tokenA });
  check('DELETE /api/projects/:id -> 200', delProject.status === 200, `status=${delProject.status}`);

  const gonePost = await api('GET', `/api/blog/${postId}`);
  check('deleted post -> 404', gonePost.status === 404, `status=${gonePost.status}`);

  // ---- summary ----
  // eslint-disable-next-line no-console
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed, ${pass + fail} checks ===`);
  if (fail > 0) {
    // eslint-disable-next-line no-console
    console.log('Failed checks:', results.filter((r) => !r.ok).map((r) => r.name).join(' | '));
    process.exit(1);
  }
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('\n[smoke] crashed:', err.message);
  process.exit(1);
});
