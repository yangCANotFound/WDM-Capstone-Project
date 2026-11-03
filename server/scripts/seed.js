/**
 * scripts/seed.js
 * ---------------------------------------------------------------------------
 * Populates MongoDB Atlas with demo content for the viva:
 *   1 admin user (hashed password) + 3 projects + 2 blog posts + 2 comments.
 *
 * Usage:
 *   cd server
 *   npm run seed            # upserts demo data, keeps existing data
 *   npm run seed -- --wipe  # deletes Projects/Posts/Comments first
 *
 * Demo credentials (change after grading):
 *   email: admin@portfolio.dev     password: admin123
 * ---------------------------------------------------------------------------
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');

const WIPE = process.argv.includes('--wipe');

const DEMO = {
  user: {
    username: 'Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@portfolio.dev',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  },
  projects: [
    {
      title: 'TaskFlow — Kanban Productivity App',
      description:
        'A drag-and-drop Kanban board with boards, lists, cards, due dates and per-user access. ' +
        'Built to practise complex nested state and optimistic UI updates.',
      imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80',
      repoUrl: 'https://github.com/your-username/taskflow',
      liveUrl: 'https://taskflow-demo.vercel.app',
    },
    {
      title: 'WeatherLens — 7-Day Forecast',
      description:
        'A weather dashboard consuming the OpenWeather API with geolocation, unit switching, and ' +
        'a cached forecast layer. First project to use Context API instead of prop drilling.',
      imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1200&q=80',
      repoUrl: 'https://github.com/your-username/weatherlens',
      liveUrl: 'https://weatherlens-demo.netlify.app',
    },
    {
      title: 'Portfolio & Blog API',
      description:
        'This very project: a RESTful Express API with JWT authentication, an author-protected ' +
        'blog, nested comments and a public contact endpoint, deployed on Render with MongoDB Atlas.',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
      repoUrl: 'https://github.com/your-username/capstone-portfolio',
      liveUrl: 'https://capstone-portfolio-api.onrender.com',
    },
  ],
  posts: [
    {
      title: 'Building a REST API with Express and Mongoose',
      content:
        'This post walks through how the back-end of this portfolio was designed.\n\n' +
        'First, every request flows through the same three layers: a route decides which controller ' +
        'runs, the controller validates and calls a model, and the model enforces the schema rules ' +
        'in MongoDB.\n\n' +
        'Second, security is layered: bcrypt hashes the password, jsonwebtoken signs a token that ' +
        'carries the user id, and the protect middleware turns that token back into req.user on ' +
        'every protected request.\n\n' +
        'Finally, all errors are funnelled into one JSON shape so the React client can rely on ' +
        'message and status codes instead of guessing.',
      excerpt: 'How the MVC layering, bcrypt + JWT authentication and central error handling fit together.',
      tags: ['node', 'express', 'mongodb'],
    },
    {
      title: 'Managing Auth State in React with Context API',
      content:
        'Prop drilling was the first problem I hit when adding login to the SPA.\n\n' +
        'The solution was an AuthProvider wrapped around the whole Router. It owns token, user, ' +
        'loading and error, exposes login/logout/register, and persists the session in ' +
        'localStorage so a page refresh does not log the user out.\n\n' +
        'Any component — including the Header — can then call useAuth() and react immediately ' +
        'when the authentication state changes.',
      excerpt: 'Why the Auth Context is the single source of truth for token and user data.',
      tags: ['react', 'context', 'jwt'],
    },
  ],
  comments: [
    { body: 'Great explanation of the middleware order — very clear!', username: 'Admin' },
    { body: 'How do you handle token expiration in the client?', username: 'Admin' },
  ],
};

const run = async () => {
  await connectDB();

  if (WIPE) {
    await Promise.all([
      Project.deleteMany({}),
      BlogPost.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    // eslint-disable-next-line no-console
    console.log('[seed] --wipe: cleared Project / BlogPost / Comment collections');
  }

  // -------- admin user (bcrypt hashed) --------
  let admin = await User.findOne({ email: DEMO.user.email }).select('+password');
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    admin = await User.create({
      username: DEMO.user.username,
      email: DEMO.user.email,
      password: await bcrypt.hash(DEMO.user.password, salt),
      role: 'admin',
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] created admin user ${admin.email}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin user already exists (${admin.email}) — skipped`);
  }

  // -------- projects --------
  for (const data of DEMO.projects) {
    const exists = await Project.findOne({ title: data.title });
    if (exists) continue;
    await Project.create({ ...data, user: admin._id });
    // eslint-disable-next-line no-console
    console.log(`[seed] + project: ${data.title}`);
  }

  // -------- blog posts + comments --------
  for (const data of DEMO.posts) {
    let post = await BlogPost.findOne({ title: data.title });
    if (!post) {
      post = await BlogPost.create({ ...data, author: admin._id });
      // eslint-disable-next-line no-console
      console.log(`[seed] + post: ${data.title}`);
    }
    const commentCount = await Comment.countDocuments({ post: post._id });
    if (commentCount === 0) {
      for (const c of DEMO.comments) {
        await Comment.create({ body: c.body, author: admin._id, post: post._id });
      }
      // eslint-disable-next-line no-console
      console.log(`[seed]   + ${DEMO.comments.length} comments on "${post.title}"`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n[seed] Done.\n  Login with: ${DEMO.user.email} / ${DEMO.user.password}\n` +
      '  (Register a NEW account in the demo to prove hashing works from scratch.)\n'
  );

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
};

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] FAILED:', err.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
