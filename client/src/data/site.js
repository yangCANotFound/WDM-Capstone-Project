/**
 * src/data/site.js
 * ---------------------------------------------------------------------------
 * Single source of truth for personal content. Change your name, email or
 * links HERE and every page updates — no hunting through components.
 * ---------------------------------------------------------------------------
 */
export const site = {
  fullName: 'Yang Zhenshen',
  shortName: 'Yang Zhenshen',
  initials: 'YZ',
  title: 'Full-Stack Developer',
  tagline: 'I build useful web applications with React, Node.js and MongoDB.',
  email: 'yangzhenshen@example.com',
  location: 'Kuala Lumpur, Malaysia (UTC+8)',
  github: 'https://github.com/yangCANotFound',
  course: 'Web Data Management and Application',
  intro:
    'I am Yang Zhenshen. I enjoy building web pages that are useful to real people — ' +
    'from the database schema up to the responsive interface.',
  // Skills groups shown on the Home page
  skills: [
    { group: 'Front-end', items: ['HTML page structure', 'CSS page design', 'React', 'React Router', 'Tailwind CSS'] },
    { group: 'Back-end', items: ['Node.js', 'Express', 'Mongoose', 'JWT authentication'] },
    { group: 'Data & Tools', items: ['MongoDB Atlas', 'Git & GitHub', 'Render', 'REST API design'] },
  ],
};

export default site;
