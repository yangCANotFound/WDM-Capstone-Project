/**
 * src/components/Footer.jsx
 * ---------------------------------------------------------------------------
 * Persistent footer. Pure presentational component driven by props:
 *   - heading  (string)  big call-to-action line
 *   - note     (string)  small credit line
 * Social URLs are props too, so tests/demos can override them.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

export default function Footer({
  heading = 'Let’s build something together.',
  note = 'Node.js · Express · MongoDB Atlas · React · Tailwind CSS',
  year = new Date().getFullYear(),
}) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-ink-900">{heading}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Full-stack developer available for freelance work and collaborations. Reach out through
            the contact form — it writes straight into my MongoDB inbox.
          </p>
          <Link to="/contact" className="btn-primary mt-5">
            Get in touch
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-300">Explore</p>
            <ul className="space-y-2">
              <li><Link className="text-ink-700 hover:text-brand-600" to="/projects">Projects</Link></li>
              <li><Link className="text-ink-700 hover:text-brand-600" to="/blog">Blog</Link></li>
              <li><Link className="text-ink-700 hover:text-brand-600" to="/contact">Contact</Link></li>
              <li><Link className="text-ink-700 hover:text-brand-600" to="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-300">Elsewhere</p>
            <ul className="space-y-2">
              <li>
                <a className="text-ink-700 hover:text-brand-600" href="https://github.com" target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a className="text-ink-700 hover:text-brand-600" href="https://linkedin.com" target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
              <li>
                <a className="text-ink-700 hover:text-brand-600" href="mailto:hello@example.com">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-300 sm:flex-row">
          <p>© {year} Alex Chen. All rights reserved.</p>
          <p className="font-mono">{note}</p>
        </div>
      </div>
    </footer>
  );
}
